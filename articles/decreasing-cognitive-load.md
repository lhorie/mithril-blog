## Decreasing cognitive load

You might have heard of something called **the paradox of choice**. We might think that having many options to choose from is a good thing, but given many similar choices, what actually happens often is that we end up spending so much time trying to analyze them, that we end up wasting more time than if we were to just randomly pick one. This phenomenon is also known as *choice paralysis*.

There's a similar phenomenon, known as **information overload**, that is similar in the way that it overwhelms us with information about a particular topic. The problem with information overload is that while all the presented information is ostensibly *correct*, it's also mostly irrelevant for the task at hand.

Frameworks are often difficult to learn due to similar cognitive patterns: a newbie comes in to a documentation side and is confronted with a variety of classes and methods that are all useful in one context or another, but it's not immediately obvious how they relate to the newbie's particular problem. When *every* problem that a developer encounters requires yet another dig through the documentation in order to learn some new incantation, or to remember what its syntax was, productivity is lost.

So, in order to not get in people's ways, it's important that frameworks and libraries try to minimize the amount of cognitive load they put on developers.

One trick that jQuery used to ease people into its vast API was function overloading:

```javascript
//set the color of one element
$("#foo").css("color", "red")

//get the color
$("#foo").css("color")

//set the color on many elements
$("h1").css("color", "red")
```

You don't need to remember if the method is called `getCss`, or `readCSS`, and whether the counterpart is `setStyle` or `setCSS` (and did you noticed the uppercase?). There's not a different API if you're setting styles on one vs many elements. It's just `css` all the time.

Compare it to Prototype.js, arguably the most popular javascript framework at the time jQuery came out:

```javascript
//set the color of one element
$("foo").setStyle({color: "red"})

//get the color
$("foo").style.color

//set the color of many elements
$$("h1").invoke("setStyle", {color: "red"})
```

You can clearly see why jQuery is still loved by many, and why Prototype.js fell by the sidelines. Having APIs that are easy to remember and that adapt to similar but slightly different use cases help the framework become transparent so that the developer can then focus on their own problems rather than be fighting against framework syntax.

Mithril also uses this design trick to help newbies ease into its API:

```javascript
//I just want a div
m("div")

//but it has text
m("div", "Hello world")

//actually, I need to toggle a class on it too
m("div", {class: isActive ? "active" : ""}, "Hello world")
```

Another slightly different example is `m.route`. It has three overloads that do fairly different things: define routes, redirect, and make links routed. This may seem weird at a glance, but it's an example of being *answer-oriented*. When it comes to routing, these are three common questions: "how do I define a bunch of routes?", "how do I redirect to a route?", and "how do I make my link go to a routed path instead of a regular URL?". Having the answer always be the same (i.e. "use m.route") means less names to memorize.

Mithril also takes it a step further and makes it easy for developers themselves to create predictable APIs with `m.prop`. We previously saw this in the [uniform access principle article](the-uniform-access-principle.html).

```javascript
var name = m.prop("")

//set the value
name("John")

//get the value
console.log(name()) // "John"
```

In a [follow-up article](json-all-the-things.html), we also saw another subtle place where Mithril encourages good API design:

```javascript
var User = function(data) {
	this.firstName = m.prop(data.firstName)
	this.lastName = m.prop(data.lastName)
}

//automatically convert response objects to User instances
m.request({method: "GET", url: "/users", type: User})
```

While this isn't technically function overloading per se, it uses the options argument pattern to provide an extensible map of parameters, so that it's easy to set as many or as few of the input parameters as you're able to. The options argument pattern effective makes every permutation of parameters a valid overload.

But more importantly, it makes the argument list for every model entity predictable: You don't need to remember the order of arguments, and knowing how to create one type of entity is enough knowledge to guess how to create others.

Which brings us to another aspect of predictable APIs: *consistency*

Again, jQuery is a great example of this:

```javascript
//how I set some css?
$("#foo").css("color", "red")

//attributes?
$("#foo").attr("title", "hello")

//data?
$("#foo").data("name", "john")
```

You can look at a method and guess (most likely correctly) how the other ones work.

---

### Interfaces, interfaces

Being conscious of consistency can make a significant difference in how one organizes code.

From my experience, I think it takes a bit of a mental shift to go from writing single-purpose application code to writing multi-purpose libraries. Single-purpose code doesn't strictly require much thought in terms of its API because it is typically only a *consumer*: it may assemble a bunch of different things, but it's rarely (if ever) used to compose into more than one bigger system.

But as systems get more complex the line between single-purpose application code and multi-purpose library code starts to blur: we often start needing  reusable application-level agglomerations of code in order to avoid problems like code duplication (i.e. two or more pieces of code that do *almost* the same thing, but not quite).

Striving for consistency implicitly means developers need to be aware of what code is already there in order to follow convention. This is, I think, where the mental shift happens. With many frameworks, conventions are baked into the boilerplate, but then teams without a good code review workflow start writing in whatever style they prefer and end up with a wild west of code when all these pieces start to come together into bigger things two years later.

As it turns out, for years OOP has offered tools like *interfaces* to help us improve code consistency. Even though Javascript isn't a statically typed OOP language, we can borrow some of these ideas.

Here's an example of some code I use at work, to illustrate:

```javascript
var select2 = {}
select2.config = function(options) {
	var type = ctrl.type, prop = ctrl.binds
	return function(element, isInitialized) {
		if (!isInitialized) {
			$(element).select2({
				ajax: {
					url: type.url,
					data: function(term) {
						return {ForAutoCompleter:true, Keyword: term}
					},
					results: function(data) {
						return {results: data.Entries.map(function(item) {
							var instance = new type(item)
							return {id: type.id(instance), text: type.label(instance), data: instance}
						})}
					}
				}
			})
			.on("change", function(e) {
				m.startComputation()
				prop(e.added ? e.added.data : null)
				m.endComputation()
			})
				
			var item = prop()
			if (item) {
				$(element).select2("data", {id: type.id(item), text: type.label(item)})
			}
		}
	}
}
```

The code above is an integration helper for the select2 autocompleter library. The exact details of the implementation aren't that important for this discussion. What we're really interested in is in seeing how it ties in to a larger system.

Let's imagine we have a model entity `User`:

```javascript
//in the model
var User = function(data) {
	this.id = m.prop(data.id)
	this.name = m.prop(data.name)
}
User.url = "/users"
User.id = function(user) {return user.id()}
User.text = function(user) {return user.name()}
```

This `User` class implements an interface: it has a static `url` property and two methods `id` and `text` which dereference a system ID and a user-friendly identifier for the `User` class. I might then later implement the same interface for a `Project` class, such that I can generically retrive the url, id and readable name for a project.

As I mentioned, Javascript doesn't have the concept of OOP interfaces, or generics, but if it was a statically typed OOP language, the interface would look something like this:

```
interface IEntity<T> {
	static string url;
	static number id(T entity);
	static string name(T entity);
}
```

The way to use the select2 widget is to pass it a model entity like `User` and a `m.prop` getter-setter, like this:

```javascript
var vm = {
	user: m.prop()
}

//in the view
m("input", {config: select2.config({binds: vm.user, type: User})})

//if we select a user from the dropdown, then `vm.user()` will point to it
```

The `selec2.config` accepts a `type` parameter to which I can pass anything that implements the `IEntity` interface. It then internally takes care of hooking up the select2 plugin so that it reads the proper id and text fields from an ajax request that is made to the appropriate url.

The helper also accepts a `binds` property, which is expected to be an `m.prop` getter-setter, and the helper bi-directionally binds the dropdown's selected value to the getter-setter.

So when it all comes together, we are then able to freely swap out what model entity populates the options for the select2 widget, and when a user picks an option from the dropdown, we can put the selected item in any getter-setter (or anything that behaves like one).

```javascript
//this is what a project autocompleter might look like
m("input", {config: select2.config({binds: vm.project, type: Project})})

//or a booking autocompleter
m("input", {config: select2.config({binds: vm.booking, type: Booking})})

//or an article autocompleter
m("input", {config: select2.config({binds: vm.article, type: Article})})
```

The end result of having defined an interface is that we don't need to go look up the select2 documentation or copy-paste a bunch of options every time we create a dropdown. Instead, the widget API behaves more like an agnostic shell, much like generic collections that you might see in a statically typed language.

Creating a predictable access pattern via the IEntity interface also lets us pivot in interesting directions. What if we wanted a dropdown that showed all the users, but only for a single project? Easy, create a factory:

```javascript
//in the model
var projectUser = function(projectID) {
	var ProjectUser = function(data) {
		return new User(data)
	}
	ProjectUser.url = "/projects/" + projectID + "/users"
	ProjectUser.id = User.id
	ProjectUser.text = User.text
	
	return ProjectUser
}

//in the view
m("input", {config: select2.config({binds: vm.user, type: projectUser(projectID)})})
```

The `projectUser` creates a class that implements IEntity. We can be sure that it will work with the autocompleter because it fulfills the contract specified by IEntity, and we can easily tell what the scope of the dropdown will be just from looking at the `url` field.

---

### Naming is hard

We can take consistency further in other directions: for example, if we needed to create a date picker widget, it would also needs to bind to a getter-setter.

So why not call the argument for that `binds` as well? Naming bi-directional binding arguments the same across the board makes the API more discoverable than, say, having specially crafted event handler names for every single widget.

```javascript
//easy to guess if everything else uses the name `binds` as a convention
m("input", {config: datepicker.config({binds: vm.date})})

//not so easy to guess
m("input", {config: datepicker.config({value: vm.date(), ondatechange: m.withAttr("value", vm.date)})})
```

When we start bringing all of our conventions together, the end result becomes familiar:

```javascript
//define a component view
select2.view = function(options) {
	return m("input", {config: select2.config(options)})
}

//use the component
select2.view({binds: vm.user, type: User})
```

If you've dabbled with components, you already know how use functions named `view`. We just saw what `binds` does, and we also saw what kinds of things can be plugged into `type`. So now, you could stumble across code like the following and immediately understand it, even without having seen any documentation:

```javascript
datepicker.view({binds: vm.date})
```

---

### Obvious is relative

But just because `binds` and `IEntity` make sense to us now, it doesn't mean that they will be obvious to someone who's not familiar with them. Documentation is still a key piece in a predictable system. Co-workers leave for greener pastures, teams grow. If your system is non-trivial and needs to last longer than even just a couple of years, it's foolish to ignore the dynamic nature of the world.

Naming conventions such as `binds` can be documented in a style guide that shows examples of usage for various widgets that already use the convention.

```javascript
//call the `.view` method of a component from your templates in order to include them
//widgets can read and write from getter-setters via the `binds` parameter

select2.view({binds: vm.user, type: User})

datepicker.view({binds: vm.date})
```

It's also good practice to document how to create a trivial `binds` implementation, so that others can learn how to extend the system within the conventions.

```javascript
//here's how a create a `binds` option for bi-directional bindings
var getterSetter = m.prop()

//asks user to change the value of a getter-setter if one is not provided
var example = function(options) {
	if (!options.binds()) {
		options.binds(prompt("Set a value:"))
	}
}

example({binds: getterSetter})
```

You can document interfaces by describing their API, and by showing examples of an implementation, as well as consumption:

```javascript
/*
interface IEntity<T> {
	static string url;
	static number id(T entity);
	static string name(T entity);
}
*/

//User implements IEntity
var User = function(data) {
	this.id = m.prop(data.id)
	this.name = m.prop(data.name)
}
User.url = "/users"
User.id = function(user) {return user.id()}
User.text = function(user) {return user.name()}

//-----------------------------------------
//consuming the interface (real world case)
select2.view({binds: vm.user, type: User})

//-----------------------------------------
//consuming the interface (simple example of generic code)
function consume(type, value) {
	console.log("url:", type.url, "id:", type.id(value), "text:", type.text(value))
}
consume(User, new User({id: 1, name: "John"}))
consume(Project, new Project({id: 1, name: "John's Project"}))

//exercise: make `ThirdPartyEntity` work w/ `consume`
consume(ThirdPartyEntity, new ThirdPartyEntity({ThirdPartyEntityID: 1, Description: "3rd party entity"}))
```

---

### Conclusion

We can make complex systems less complex by creating consistent patterns, and documenting these patterns effectively.

Code grows and rots, so it's important to plan ahead.

I once read a theory that developers hit walls of complexity every time they increase the size of their codebases by an order of magnitude (i.e. the idea is that a junior developer might find it hard to expand their simple procedural programs past 3000 lines, and that developers hit another wall of complexity at 30,000 lines, and again at 300,000 and so on)

My own theory is that the these walls appear when the volume of complexity of a codebase exceeds the volume of complexity solved by the libraries it uses. For example, jQuery is undoubtedly useful when dealing with browser quirks, but once an application grows over a few thousand lines of code, unstructured jQuery code simply becomes too difficult to maintain, and you start needing the discipline of a framework to organize code. But when you're at tens of thousands of lines of code, you start to run out of entity types to CRUD, and your application growth starts to build on top of existing concepts. This is when you need the mental shift from being a library consumer to being a reusable component author, but with a focus on the interacting parts within the application (as opposed to generic one-glove-fit-all open source libraries).

Hopefully the ideas we saw in this article will help you tame complexity if you need to scale past the hundreds of lines of code wall.

