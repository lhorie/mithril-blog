## Prototypes, closures and the zen of Javascript OOP

>	The venerable master Qc Na was walking with his student, Anton. Hoping to prompt the master into a discussion, Anton said "Master, I have heard that objects are a very good thing - is this true?" Qc Na looked pityingly at his student and replied, "Foolish pupil - objects are merely a poor man's closures."
>
>	Chastised, Anton took his leave from his master and returned to his cell, intent on studying closures. He carefully read the entire "Lambda: The Ultimate..." series of papers and its cousins, and implemented a small Scheme interpreter with a closure-based object system. He learned much, and looked forward to informing his master of his progress.
>
>	On his next walk with Qc Na, Anton attempted to impress his master by saying "Master, I have diligently studied the matter, and now understand that objects are truly a poor man's closures." Qc Na responded by hitting Anton with his stick, saying "When will you learn? Closures are a poor man's object." At that moment, Anton became enlightened.

If you've been reading the Mithril [guide](http://lhorie.github.io/mithril/getting-started.html) or following the blog, you might be used to seeing controllers that look like this:

```javascript
var ProjectDetailsCtrl = function() {
	this.name = m.prop("My Project");
	this.save = function() {
		Project.save({name: this.name()});
	}
};
```

This code takes advantage of the dynamic scoping of the `this` keyword in order to aggregate data. When the `ProjectDetailsCtrl` function is used as a constructor, we then get an object that has a `name` and a `description` - basically a class instance. And just like you would expect, this class exposes public properties:

```javascript
var controller = new ProjectDetailsCtrl();
console.log(controller.name()); // logs "My Project" because name is a public property
```

### What about private properties?

We can achieve privatization by using *closures*. If you don't know what a closure is, there are [plenty of great explanations on the web](http://stackoverflow.com/questions/111102/how-do-javascript-closures-work), but in a nutshell, a closure happens when a function accesses a variable from outside of its own scope.

Here's a modification of the example above that makes the `name` private:

```javascript
var ProjectDetailsCtrl = function() {
	var name = m.prop("My Project");
	this.save = function() {
		Project.save({name: name()}); // `name` can be used internally, but not accessed from outside the class
	}
};
```

A somewhat obscure feature of Javascript is that functions that return objects will use the returned value as the instatiated object if those functions are called with the `new` keyword.

In other words, instead of attaching public properties to `this`, we can actually attach them to an object and return that instead.

```javascript
var ProjectDetailsCtrl = function() {
	var name = m.prop("My Project");
	var save = function() {
		Project.save({name: name()});
	}
	
	return {name: name, save: save};
};

var controller = new ProjectDetailsCtrl();
console.log(controller.name()); // logs "My Project" because `name` is a public property
```

As you can see, we just re-implemented the publicness of the original class without using the `this` keyword. This may seem like a silly exercise, but implementing our class this way has some interesting properties.

What we're doing now is aggregate `name` and `save` using **lexical scoping**, instead of dynamic scoping. What this means is that the integrity of a class constructed this way cannot be broken dynamically. Consider this simple Mithril template:

```javascript
var projectDetailsTpl = function(ctrl) {
	return m("a", {onclick: ctrl.save}, "Save project");
}
```

Here we assign the save function to an attribute, which might be called later via [`Function::apply`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply). The problem is that we are not storing a reference to the controller object so the `apply` call inside the Mithril engine cannot restore the context of the function, making the `this` keyword point to something else when `save` runs.

If our class relies on the `this` keyword to maintain its internal integrity, then we run into a problem. We need to `bind` the function in order to lock down the relationship between class properties.

```javascript
var ProjectDetailsCtrl = function() {
	this.name = m.prop("My Project");
	this.save = function() {
		Project.save({name: this.name()});
	}.bind(this);
};

var projectDetailsTpl = function(ctrl) {
	//without the `bind` above, `this.name` would not point to the correct thing when `ctrl.save` runs as an event handler 
	//with `bind`, everything works as expected
	return m("a", {onclick: ctrl.save}, "Save project");
}
```

When we use closure-based classes, none of this is a problem, and no `bind` calls are required.

```javascript
var ProjectDetailsCtrl = function() {
	var name = m.prop("My Project");
	var save = function() {
		Project.save({name: name()});
	};
	
	return {name: name, save: save}
};
var projectDetailsTpl = function(ctrl) {
	//no `bind` shenanigans needed to make this event handler work correctly
	return m("a", {onclick: ctrl.save}, "Save project");
};
```

But here's where Qc Na slaps us in the wrist. "Closures are a poor man's object!"

### Enlightenment

Recall what I said about closure-based classes: using closures to maintain the integrity of a class makes it immune to dynamic changes. This means that when we use closures, we lose the ability to dynamically mix different code into contexts. 

To illustrate, look at this snippet:

```javascript
var ProjectDetailsCtrl = function() {
	GoogleAnalyticsCtrl.call(this)
	
	this.name = m.prop("My Project");
	this.save = function() {
		Project.save({name: this.name()});
	}
}

var GoogleAnalyticsCtrl = function() {
	this.name = m.prop("default");
	this.track = function() {
		console.log("tracked " + this.name());
	}
}

var controller = new ProjectDetailsCtrl();
controller.track(); // logs "tracked My Project"
```

Notice how we can override `GoogleAnalyticsCtrl`'s `name` and then use the new `name` from `track`. We've effectively implemented *class inheritance*.

With closure-based classes, this cross-polination between the two classes does not work:

```javascript
var ProjectDetailsCtrl = function() {
	GoogleAnalyticsCtrl.call(this)
	
	var name = m.prop("My Project");
	var save = function() {
		Project.save({name: name()});
	}
	
	return {name: name, save: save}; //does not have `track` method
}

var GoogleAnalyticsCtrl = function() {
	var name = m.prop("default");
	var track = function() {
		console.log("tracked " + name()); //`track` does not use overridden `name`
	}
	
	return {name: name, track: track};
}

var controller = new ProjectDetailsCtrl();
controller.track(); // error
```

### Conclusion

Just remember that classes don't truly exist in Javascript. What we are really doing is choosing between using two different features to *emulate* classes. The closure-based approach is useful to group features in a controlled and locked down manner, and the `this`-based approach is useful to make the grouping flexible.

