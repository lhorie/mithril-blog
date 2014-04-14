## Building a "Seinfeld" App

*April 13, 2014*

To-do apps have become the "hello world" of javascript frameworks; they are easy to build and just structured enough to be a good showcase of framework features.

Today we're going to take that one step further and use [Mithril](http://lhorie.github.io/mithril) to build something that is a little bit more focused and a little bit more useful.

You may have heard of the ["don't break the chain" concept, made famous by comedian Jerry Seinfeld](http://lifehacker.com/281626/jerry-seinfelds-productivity-secret). The gist is this: if there's an activity you want to turn into a habit, get a calendar and put an "X" on every day that you do it. The goal is to have a lot of consecutive "X"s, with no gaps, hence "don't break the chain".

The rationale behind this is that a lot of people have trouble sticking with something for long periods of time due to lack of focus or prioritization tools or whatever. Seinfeld's trick just makes use of gamification to nudge us to be more persistent than we perhaps would be without the aid of a tool. So that's what we're gonna build.

---

### View layer

Let's start by creating an HTML file:

```markup
<!doctype html>
<html>
	<head>
		<title>Don't break the chain</title>
	</head>
	<body>
		<script src="mithril.js"></script>
		<script>
		//app goes here
		</script>
	</body>
</html>
```

There's really no consensus on the number of days needed to actually form a habit, so let's just build a 7x7 grid because 7 days per week is familiar and squares are pretty.

Here's what we might want our grid template to look like:

```javascript
//our app's namespace
var chain = {};

//model goes here

//controller goes here

//view
chain.view = function(ctrl) {
	return m("table", chain.seven(function() {
		return m("tr", chain.seven(function() {
			return m("td", [
				m("input[type=checkbox]")
			]);
		});
	});
};
```

If you were coding along, you would probably notice that typing 7 table rows and 7 columns per row would result in a pretty big and repetitive template. So what we did above is define a **stub** method called `chain.seven` which will repeat whatever you pass to it 7 times. 

Stubbing basically means just calling a function that doesn't exist yet. It's a great way of cranking out some code quickly: it helps mitigate "analysis paralysis" by letting you focus on the easy stuff (i.e. the general DOM structure), so you can worry about the repetition stuff in isolation later.

Note that implementing `chain.seven` is an easy-to-complete task, so it makes for a good warm-up task to get the juices going if you were to stop working on this app now and came back to work on it tomorrow. This is a powerful productivity trick: if you're getting bogged down, just write a stub and move on! It helps you shift away from the all-or-nothing approach to development that stalls a lot of people and nudges you towards incremental progress. 

Now that we have do have our basic grid structure figured out, we can get the `chain.seven` utility out of the way:

```javascript
//create a helper utility that we can use in the view
chain.seven = function(subject) {
	var output = [];
	for (var i = 0; i < 7; i++) output.push(subject(i));
	return output;
};
```

Note that we pass the iteration index `i` as a parameter to the `subject` callback. This will be useful later.

It's worth noting that KISS ("keep it simple, stupid") is a strong driving principle in Mithril. Note how we didn't need to look up any framework APIs to create the `chain.seven` extension to our view language. It's just plain javascript. We can quickly make our templates as expressive and application-specific as we want.

Combined w/ techniques like stubbing, you can write code almost as fast as it appears in your mind, and rely on your console's null reference exceptions as a running "todo list" of sorts.

Now that we have a basic template setup, we can render it to see what it looks like:

```javascript
//our app's namespace
var chain = {};

chain.view = function(ctrl) {
	return m("table", chain.seven(function() {
		return m("tr", chain.seven(function() {
			return m("td", [
				m("input[type=checkbox]")
			]);
		}));
	}));
};

//create a helper utility that we can use in the view
chain.seven = function(subject) {
	var output = [];
	for (var i = 0; i < 7; i++) output.push(subject(i));
	return output;
};

//render it
m.module(document.body, {controller: function() {}, view: chain.view});
```

---

### Model layer

Now we can start thinking about functionality. Our app is pretty simple: all we need to do is make checkboxes retain their states after they've been checked.

Since it's highly unlikely that anyone is ever going to keep the app running for days on end, we need a persistence layer. The simplest thing we can use is `LocalStorage`. It doesn't work in older browsers, but we don't want to get bogged down setting up a database for a tutorial app that we're probably only going to use in our own smartphones, so it's adequate enough.

The LocalStorage API is pretty straightforward. If you add a property to the `localStorage` object, its value is cast to a string:

```javascript
localStorage.test = 1 // "1"
localStorage.foo = [1, 2, 3] // "1,2,3"
localStorage.bar = {a: 1} // "[object Object]"
```

Our app consists of 49 days, which can be either marked with an "X", or not. So what we need to do is persist a list of booleans. Since LocalStorage has no concept of fetching a subset of a data list, the simplest storage implementation would be something like this:

```
//a list model API
chain.save = function(list) {
	localStorage["chain-app.list"] = JSON.stringify(list);
};
chain.load = function() {
	return JSON.parse(localStorage["chain-app.list"] || "[]");
};
```

This API can be used like this:

```javascript
var list = chain.load();
list[42] = true; //set the 42nd day
chain.save(list);

//reset the list
chain.save([]);
```

In addition to the actual list of checks, we also need to know when our chain started. So we also need an auxiliary model entity to store the start date.

```javascript
//a date model API
chain.today = function() {
	var now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}
chain.resetDate = function() {
	return localStorage["chain-app.start-date"] = chain.today().getTime();
}
chain.startDate = function() {
	return new Date(parseInt(localStorage["chain-app.start-date"] || chain.resetDate()));
}
chain.dateAt = function(index) {
	var date = new Date(chain.startDate());
	date.setDate(date.getDate() + index);
	return date;
}
```

This API can be used like this:

```javascript
var today = chain.today() //today at midnight

var startDate = chain.startDate(); //start date is today

var isToday = chain.dateAt(3).getTime() === chain.today() //is three days from now the same as today? Should be false

//reset
var newStartDate = chain.resetDate(); //new start date is today

```

Again, note how we didn't need to use any framework code in the model layer. We could have used classes, but we're just creating an API without them to illustrate the point that it's perfectly possible to maintain the MVC pattern while prototyping, without the need for bureaucracy. As long as our APIs are simple and well defined, we can always refactor later.

---

### Controller layer

In Mithril, controllers are typically meant to be the glue between the model and view layer. Here's one way to implement it:

```javascript
chain.controller = function() {
	var list = chain.load();
	
	this.isChecked = function(index) {
		return list[index]
	};
	this.check = function(index, status) {
		if (chain.dateAt(index).getTime() <= chain.today().getTime()) {
			list[index] = status;
			chain.save(list);
		}
	};
};
```

Our controller doesn't actually expose the raw list from the model. Instead it implements a `isChecked` method to read the state for a given day, and a `check` method to set it (with some validation to prevent setting days in the future).

With this API, we are able to expose all the model data that we need to the view. Below is an example of how this controller API can be used:

```javascript
var ctrl = new chain.controller();

var isFirstDayChecked = ctrl.isChecked(0); //is first day checked?

ctrl.check(0, true); //check off the first day
```

Now that we have a controller attached to our namespace, we can actually use it as a Mithril module, i.e. we can just pass the namespace object wholesale to Mithril initializer method:

```javascript
//call this at the end of the code to initialize the `chain` app
m.module(document.body, chain);
```

With this call, the controller gets instantiated and this instance is passed to the view as a parameter (the `ctrl` argument of the `view` function).

---

### Putting it all together

Now all we need to do is make the view layer dynamically load the data that we exposed via the controller. Normally, this is done in frameworks via what are called **bi-directional data bindings**.

A bi-directional data binding is really just a fancy way of saying that a DOM element has code attached to it that sets its value based on our model data, and an event handler to update the model data when a UI change happens.

Here's a simple binding helper function: it returns the set of attributes needed to do bi-directional data binding based on a controller instance and an model layer's list index.

```javascript
chain.checks = function(ctrl, index) {
	return {
		onclick: function() {
			ctrl.check(index, this.checked);
		},
		checked: ctrl.isChecked(index)
	};
}
```

Now we can use this binding in the template we created at the beginning:

```
chain.view = function(ctrl) {
	return m("table", chain.seven(function(y) {
		return m("tr", chain.seven(function(x) {
			return m("td", [
				m("input[type=checkbox]", chain.checks(ctrl, chain.indexAt(x, y)))
			]);
		}));
	}));
};
```

If you have been paying attention you probably noticed that we just defined another stub called `chain.indexAt`: our template doesn't expose the raw offset that we need for our model API, but the `chain.seven`'s callback argument can be used to compute it.

`chain.indexAt(x, y)` will need to take a grid position and return the appropriate flat-list index, assuming that the days are counted like in a regular calendar.

```javascript
chain.indexAt = function(x, y) {
	return y * 7 + x;
}
```

This should be enough to make the UI dynamic: you should be able to check off a box, refresh the page and see that it retained its state.

Before we continue, let me just me a note about data bindings. Most frameworks have generic binding syntax, but they're often prescriptive and inflexible.

Creating our own custom bindings like we did above has a lot of advantages: we can have super expressive code that reads almost like prose - `m("input[type=checkbox]", chain.checks(ctrl, chain.indexAt(x, y)))` is roughly "a checkbox that checks the index that corresponds to these x and y coordinates"

In addition, we can maintain full control over the implementation, and we can keep these implementation details neatly tucked in the view layer, rather than pollute the controller layer or having to create other complexity layers.

---

One last thing we can do to make the app more usable is highlight the checkbox that corresponds to the current day. Let's write another data binding for this:

```javascript
chain.highlights = function(index) {
	return {
		style: {
			background: chain.dateAt(index).getTime() == chain.today().getTime() ? "silver" : ""
		}
	};
};
```

Notice that this binding is not bi-directional - it doesn't need an event handler. All it does is set a background color based on whether the cell corresponds to today.

We can then refactor our view to use our new binding:

```javascript
chain.view = function(ctrl) {
	return m("table", chain.seven(function(y) {
		return m("tr", chain.seven(function(x) {
			var index = chain.indexAt(x, y)
			return m("td", chain.highlights(index), [
				m("input[type=checkbox]", chain.checks(ctrl, index))
			]);
		}));
	}));
};
```

This last binding is noteworthy for a few reasons: for one thing, it illustrates how we can easily tuck away noisy template snippets - I mean, really, who likes inline style attributes? :)

Another thing to notice is that despite this snippet being part of the view layer (conceptually), it accesses the model directly (it calls `chain.today`) without going through the controller. Logically, the concept of "today" doesn't need class instantiation management, so it's perfectly reasonable to skip controller bureaucracy for it altogether.

The last thing to note is that because our views are plain javascript, things like caching computed values (`var index` in our case) are easy to do and completely transparent, so it's highly unlikely that you would ever run into [bizarre problems](http://stackoverflow.com/questions/14376879/error-10-digest-iterations-reached-aborting-with-dynamic-sortby-predicate).

---

### Conclusion

This is pretty much all we need to have a working app. Here's the code in its entirety:

```javascript
<!doctype html>
<html>
	<head>
		<title>Don't break the chain</title>
	</head>
	<body>
		<script src="mithril.js"></script>
		<script>
//our app's namespace
var chain = {};

//model
chain.save = function(list) {
	localStorage["chain-app.list"] = JSON.stringify(list);
};
chain.load = function() {
	return JSON.parse(localStorage["chain-app.list"] || "[]");
};

chain.today = function() {
	var now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}
chain.resetDate = function() {
	return localStorage["chain-app.start-date"] = chain.today().getTime();
}
chain.startDate = function() {
	return new Date(parseInt(localStorage["chain-app.start-date"] || chain.resetDate()));
}
chain.dateAt = function(index) {
	var date = new Date(chain.startDate());
	date.setDate(date.getDate() + index);
	return date;
}



//controller
chain.controller = function() {
	var list = chain.load();
	
	this.isChecked = function(index) {
		return list[index]
	};
	this.check = function(index, status) {
		if (chain.dateAt(index).getTime() <= chain.today().getTime()) {
			list[index] = status;
			chain.save(list);
		}
	};
};



//view
chain.view = function(ctrl) {
	return m("table", chain.seven(function(y) {
		return m("tr", chain.seven(function(x) {
			var index = chain.indexAt(x, y)
			return m("td", chain.highlights(index), [
				m("input[type=checkbox]", chain.checks(ctrl, index))
			]);
		}));
	}));
};

chain.seven = function(subject) {
	var output = [];
	for (var i = 0; i < 7; i++) output.push(subject(i));
	return output;
};

chain.checks = function(ctrl, index) {
	return {
		onclick: function() {
			ctrl.check(index, this.checked);
		},
		checked: ctrl.isChecked(index)
	};
}

chain.indexAt = function(x, y) {
	return y * 7 + x;
}

//render it
m.module(document.body, chain);
		</script>
	</body>
</html>
```

From here, you can start adding polish to the app: [making it "Add to Home Screen" friendly](http://stackoverflow.com/questions/8195741/how-do-they-do-this-mobile-site-added-to-homescreen-appears-as-standalone-app), maybe [styling the checkboxes](http://webdesign.tutsplus.com/tutorials/quick-tip-easy-css3-checkboxes-and-radio-buttons--webdesign-8953), or just using a CSS framework like [Bootstrap](http://getbootstrap.com/) for a quick improvement in look and feel, etc.

---

### Homework

You probably noticed that this app doesn't let you write down what is the actual activity that you are tracking. Adding a text input that lets you do so and saves this text to `localStorage` is a good homework assignment to solidify all the important concepts we covered in the article.

Another feature that you should try to add is a button to reset the app (after all, an app that becomes useless after 49 days is no fun.)

If you want to build more experience with real life coding, another thing you can do is take this app and improve it so that you can track more than one activity. This is a great exercise for reading existing code and refactoring, as well as learning more about useful [Mithril](http://lhorie.github.io/mithril) features.

Remember that if you need help or have questions, you are always welcome to post in the [mailing list](https://groups.google.com/forum/#!forum/mithriljs) or send me an [email](https://github.com/lhorie/).

