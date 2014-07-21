## Just what the doctor prescribed

If you are familiar with enterprisey frameworks, you probably have heard of a thing called **dependency injection**. If not, read on.

Dependency injection is really just a fancy way of saying that instead of declaring things inside of functions, the code is written in such a way that these things are passed into the functions as arguments.

Let me illustrate. You're probably familiar with this idiom in Mithril:

```javascript
//model
var Project = {
	list: function() {
		return m.request({method: "GET", url: "/api/project"})
	}
}

//controller
var MyController = function() {
	this.projects = User.list()
}

//view
var MyView = function(ctrl) {
	return ctrl.projects.map(function(project) {
		return m("div", project.name)
	})
}

//initialize routing
m.route(document.body, "/", {
	"/": {
		controller: MyController,
		view: MyView
	}
})
```

It's all very straightforward code: we define a model entity, we then use it in a controller, and we render it in a view.

There's one caveat though: the controller isn't very reusable because it always requests the same thing: a list of all projects. What if we wanted to have a list of all projects who were created after a certain date? Or a list of projects assigned to a certain person? Using the coding style above means we either need to start adding `if` statements to the controller, or create new controllers altogether.

### Enter dependency injection

With dependency injection we can write a controller where the actual list of projects is passed in as an argument to the function:

```javascript
//model
var Project = {
	list: function() {
		return m.request({method: "GET", url: "/api/project"})
	}
}

//controller
var MyController = function(options) {
	this.projects = options.projects
}

//view
var MyView = function(ctrl) {
	return ctrl.projects.map(function(project) {
		return m("div", project.name)
	})
}

//initialize routing
m.route(document.body, "/", {
	"/": {
		controller: function() {
			return new MyController({projects: Project.list()})
		},
		view: MyView
	}
})
```

This time, notice that we are passing an `options` argument to the controller, and then passing in the actual data at routing time. This means that now the controller is agnostic about what is contained in the list of projects.

This way we can create different data sources and tie them to specific routes. Here's one example:

```
//model
var Project = {
	list: function() {
		return m.request({method: "GET", url: "/api/project"})
	},
	listByAssignee: function(userID) {
		return m.request({method: "GET", url: "/api/project", data: {assignee: userID}})
	}
}

// controller and view are the same ...

//initialize routing
m.route(document.body, "/", {
	"/": {
		controller: function() {
			return new MyController({projects: Project.list()})
		},
		view: MyView
	},
	"/assigned/:userID": {
		controller: function() {
			return new MyController({projects: Project.listByAssignee(m.route.param("userID"))})
		},
		view: MyView
	}
})
```

As you can see, we defined a second route that works just like the previous one, except that it displays projects assigned to a person, rather than all projects.

This coding style also happens to be recursion-friendly: now our controller has a signature that allows us to nest it into other components and pass data to it naturally. So no only do we have turtles all the way down as we create components, we are also ready to have turtles all the way up too.

So there you have it. Painless dependency injection.