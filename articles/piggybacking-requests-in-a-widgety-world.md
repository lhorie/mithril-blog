## Piggybacking requests in a widgety world

A while back I was building a dashboard tool to display various metrics about a given person. This dashboard had a bunch of widgets, which could be toggled on or off depending on user's preferences. Some widgets are also used elsewhere in the application, so, of course, each widget needed to be self contained.

One recurring pattern was that I needed to display some user information in each widget (for example, the user's name).

Now, if the name was the only piece of data that we shared between widgets, we could consider doing a URL hack:

```
http://example.com/dashboard/John_Doe
```

Of course, this doesn't really work once you need more pieces of information (let's say the user's email), and this approach also carries maintenance liabilities: what if the user got married and changed their name? That would break our URL.

So, since we were using a RESTful web service architecture, the responsible thing to do was to have a `users` web service, and have the widgets send requests to it.

For my case, the web service that was getting called repeatedly was one to return a single user, but for the sake of making this discussion more interesting, I'm going to pretend that our widgets dealt with a small lists of users.

If you had to implement a client-side model layer to support this architecture, you'd probably create some sort of CRUD class: maybe have a `list` method that fetches a list of users, right?

```javascript
//our model entity
var User = {
	list: function() {
		return m.request({method: "GET", url: "/api/users"})
	}
};

//a module that uses our model entity
var widget1 = {};
widget1.controller = function() {
	this.users = User.list()
};
```

But right away, there's a problem: if more than one widget exists in the page at the same time, and each of those widgets needs user information, then each widget needs to individually call the web service, causing the application to send multiple identical requests to the server! (Remember, that some of these widgets are used elsewhere, so we can't move this controller logic "up a level")

Here's a snippet of [Mithril](http://lhorie.github.io/mithril) code to illustrate:

```javascript
var hiredThisYear = function() {/*filter by hire date*/};
var inJohnDoeTeam = function() {/* filter by team*/};

var widget1 = {};
widget1.controller = function() {
	this.users = User.list()
		.then(inJohnDoeTeam);
};

var widget2 = {};
widget2.controller = function() {
	this.users = User.list()
		.then(hiredThisYear);
};

new widget1.controller();
new widget2.controller();
```

Notice `widget1` is trying to compute a list of users in John Doe's team, and `widget2` is trying to compute a list of users who were hired this year. Both make identical AJAX requests to `/api/users`. What we really want is to send a request only once.

This is where **separation of concerns** comes in: the reason why the MVC pattern has a model layer instead of just letting us make naked AJAX requests straight from controllers is precisely so we can abstract away the implementation details regarding how data is handled.

In our case, we want to ensure that requests aren't duplicated, so all we need to do is change the implementation of our model entity to make duplicate requests piggyback off the first pending request:

```javascript
var cache = {};
var User = {
	list: function() {
		if (!cache["User.list"]) {
			cache["User.list"] = m.request({method: "GET", url: "/api/users"})
				.then(function(value) {
					delete cache["User.list"];
					return value;
				});
		}
		return cache["User.list"];
	}
};
```

This way, when two or more calls to `User.list` happen at the same time, only the first one sends off a request. All the calls then return the same promise. After the promise resolves, we clear the cache via the `then` callback so we can request new fresh data at a later time.

```javascript
var widget1 = {};
widget1.controller = function() {
	this.users = User.list()
		.then(inJohnDoeTeam);
};

var widget2 = {};
widget1.controller = function() {
	this.users = User.list()
		.then(hiredThisYear);
};

new widget1.controller();
new widget2.controller();
```

As you can see above, the controller layer code looks exactly like it did before, but now instantiating the two widgets at the same time only sends one request to the server.

With some small changes, this technique can also be used for parameterized requests:

```javascript
var cache = {};
var User = {
	list: function(data) {
		var key = "User.list" + JSON.stringify(data)
		if (!cache[key]) {
			cache[key] = m.request({method: "GET", url: "/api/users", data: data})
				.then(function(value) {
					delete cache["User.list"];
					return value;
				});
		}
		return cache[key];
	}
};
```

One neat thing about promises is that calling `then` multiple times from the same promise (which is what we're doing now) simply returns new promises for each call. Every one of those returned promises resolve to values that are independent of what's happening in sibling computation chains, so `then(inJohnDoeTeam)` is not affected by `then(hiredThisYear)` and therefore, when the AJAX request completes, the list of users for `widget1` is only filtered to users in John's team, and the list in `widget2` is only filtered by users hired this year, as expected.

In other words, the controller code continues to work correctly *without changes*.

I can't stress enough how important this is. Typically, you only start noticing (or financially caring about) performance problems when an app is already at a stage where there's a lot of code written. Being able to conceptualize a performance optimization like this at the design pattern level, and being able to implement it with minimal disruption to a large production application is a great example of well written code shining.

If you didn't get the point of MVC before, or if you think it doesn't bring any benefits, I would urge you to take some time to challenge yourself and try to understand the purpose behind the MVC design pattern. Your future self might thank you later.