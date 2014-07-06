## What's in a namespace

In Mithril examples, I often use modules interchangeably as namespaces:

```javascript
//a namespace
var app = {};

app.controller = function() {
	this.greeting = "hello";
};

app.view = function(ctrl) {
	return m("h1", ctrl.greeting);
};

m.module(document.body, app);
```

But the reality is that this 1-to-1 mapping between modules and namespaces isn't strictly required. In this article we'll look at different ways of organizing code and why you might want to choose one way over another.

### Vertical namespaces

This is what we just saw in the snippet above: each module is its own namespace, i.e. a namespace object contains a `controller` and a `view` properties. The namespace object might also contain helper functions and auxiliary model entities. This organization style is good when modules are self-contained units of functionality.

For example, you might have a login page, a registration page and a user dashboard. Typically, for the purposes of development, each of these pages can be thought of as a standalone part of the application, and from a high-level perspective, it makes sense to have a `login` module, a `registration` module and a `dashboard` module.

Trivial example apps are another use case where modules as namespaces are appropriate: a single namespacing module is a good middle ground to hold the entirety of our application without the bureaucracy of numerous namespaces and without polluting the global scope.

### Horizontal namespaces

Another way of organizing code is to namespace things based on the layer where they live:

```javascript
//controllers namespace
var controllers = {};

controllers.GreetingCtrl = function() {
	this.greeting = "hello";
};

//views namespace
var views = {};

views.greetingView = function(ctrl) {
	return m("h1", ctrl.greeting);
};

m.module(document.body, {controller: controllers.GreetingCtrl, view: views.greetingView});
```

This organization style is appropriate when there's a lot of repetition somewhere. For example, financial applications often have a large number of paginated, filterable tables. We might have a table view, a filters view and a pagination view that get reused several times in different parts of the application. In applications like this, where we expect a high degree of code reusability, it's often awkward to map the reusable pieces to a neat one-controller-to-one-view paradigm.

This style can also be more suitable when there's a large amount of scope creep or ad-hoc development, since in those cases, it's common that multiple existing pieces of functionality might get combined to support new features (i.e. "can we also put thing X as a sidebar panel here").

### Quick and dirty

One other way to organize code is to not structure it at all:

```javascript
var GreetingCtrl = function() {
	this.greeting = "hello";
};

var greetingView = function(ctrl) {
	return m("h1", ctrl.greeting);
};

m.module(document.body, {controller: GreetingCtrl, view: greetingView});
```

Notice that in this example, there are no namespaces - instead we construct an anonymous module when we call `m.module`.

There are some obvious weaknesses with this approach: we need to rely heavily on naming conventions to avoid collisions, and everything lives in the global scope (although you could put your code in an application-level namespace to prevent global scope pollution). But conversely, the lack of structure means that there's no namespacing verbosity when referencing arbitrary pieces of functionality from arbitrary places, so this style is suitable for exploratory coding and for hacking up quick prototypes, where we're not sure how pieces might end up coming together. Due to the reliance on naming conventions, this style is also grep-friendly: if we do need to organize code more formally down the road, we can search and replace things by name more easily than if our code used a mix of namespace objects and clever usage of the `this` keyword.

### Conclusion

Applications are not created equal, so it makes sense that we should have flexibility when organizing our code. The structure of sample code in the Mithril docs and here on the blog might appear to suggest that code should always fit neatly in a module, but Mithril itself doesn't actually impose any specific way of doing things.

It's always a good idea to take the time to think about the reusability profile of your application, so you can organize code in a way that makes sense for you. 