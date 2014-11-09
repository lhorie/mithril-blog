## Module partial application

Today's article will be about a short and sweet idiom.

In Mithril modules, controllers are class constructors, which means that in order to manually use them, you need to instantiate them.

This is required in order to provide contextualization to modules (i.e. the ability to say when a module gets created and when it gets destroyed), but having to remember to pass controller instances to views can get a little cumbersome once you start breaking down a big app into a lot of modules:

```javascript
var root = {}

root.controller = function() {
	this.search = new search.controller()
	this.filters = new filters.controller()
	this.list = new list.controller()
}

root.view = function(ctrl) {
	search.view(ctrl.search)
	filters.view(ctrl.filters)
	list.view(ctrl.list)
}
```

A simple way to optimize this is to use *partial application* to pre-bind a controller instance:

```javascript
var submodule = function(module, args) {
	return module.view.bind(this, new module.controller(args))
}
```

This returns a view function with the controller already passed into it. We can then create references to that in the root controller instead:

```javascript
root.controller = function() {
	this.search = submodule(search)
	this.filters = submodule(filters)
	this.list = submodule(list)
}

root.view = function(ctrl) {
	ctrl.search(),
	ctrl.filters(),
	ctrl.list()
}
```

Just remember that controllers should never be instantiated from views ([as per the documentation](http://lhorie.github.io/mithril/components.html)), which means you should never call `submodule` from a view.

---

### Shouldn't we be using view-models?

If you read that documentation page through to the end, you'll see I talk about moving logic out of controllers into view models.

But that doesn't mean controllers should just be abolished altogether. One case where nesting components is necessary is when dealing with dynamic or extensible component placement, i.e. when you have a container module where different modules might be dropped in. The classical example is a dashboard where users can customize what widgets show up.

The benefit of using the trick above is that you only need one variable to hold your module instance instead of two:

```javascript
//without using the partial application trick
var dashboard = {}

dashboard.controller = function(innerModule) {
	this.innerController = new innerModule.controller()
	this.innerView = innerModudle.view
}

//using it
var dashboard = {}

dashboard.controller = function(innerModule) {
	this.innerView = submodule(innerModule)
}
```

I hope you'll find this trick useful.