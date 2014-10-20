## Common mistakes

Any time we start learning something new, we are bound to stumble and make mistakes along the way. In this article, we'll look at some common issues that I've seen people run into when they were getting into Mithril.

---

### 1. Using jQuery

It's surprisingly tempting to use jQuery to manipulate the DOM from a controller or even a view-model, especially for those without experience in MVC frameworks. I've [talked about jQuery's scalability problem before](http://lhorie.github.io/mithril/comparison.html). The gist is that jQuery DOM manipulation implicitly puts UI state data in the DOM itself, and as applications grow larger, it becomes harder and harder to reason about that state, and the tendency to build more functionality on top of it causes the application to become brittle and hard to modify.

Another problem with mixing jQuery is that it creates a tight coupling between the data and the presentation layer, making both harder to test in isolation.

The alternative to using jQuery is to apply the same MVC concepts that you would see in server-side frameworks: have data live in the model layer, and explicitly derive the state of the view from the data. I've [talked about using view-models](what-is-a-view-model.html) for [separating ORM classes from UI state](mapping-view-models.html) within the model layer. Moving away from jQuery is simply an exercise in applying the same workflow as you would in your traditional server-side MVC framework of choice, and being mindful of the existence and the nature of UI state.

With all of this said, you *can* use jQuery to augment the behavior of an element via the [config attribute](http://lhorie.github.io/mithril/mithril.html#accessing-the-real-dom). Just avoid doing it in controllers and view-models.

---

### 2. Misunderstanding dynamic scoping

Let's face it, the `this` keyword is confusing. Many seasoned developers still struggle with it, especially when you start adding nested anonymous functions, partial application, and functions-as-arguments into the picture. It's a good idea to consider using idioms without language-specific caveats to help ease new developers into the codebase.

One common way to make `this` more junion-friendly is to use the `var self = this` idiom. Be aware though that `self` is just as non-descriptive as a variable name as `this` and it can yield somewhat repetitive code.

The best thing to do to avoid `this` confusion as a team grows is to avoid using it altogether. Here's an example that uses `this`:

```javascript
var home = {}
home.vm = {
	init: function() {
		this.name = "foo"
	}
}
```

Here's an alternative way of writing the snippet above using the easier-to-understand lexical scoping:

```javascript
var home = {}
home.vm = {}
home.vm.init = function() {
	home.vm.name = "foo"
}
```

The structure of the data is now much more obvious, albeit at the expense of adding some repetition in the form of explicit `home.vm` references everywhere.

Here's a cleverer way of writing it that reduces repetition:

```javascript
var home = {}
new function(vm) {
	vm.init = function() {
		vm.name = "foo"
	}
}(home.vm = {})
```

---

### 3. Backwards controllers

Controllers are a *scoping* mechanism. They are responsible to defining what is accessible by the view: what data can be iterated over, how is that data sliced from the server-side data set, what operations can be performed on this data. People are often confused about the role of controllers because its primary responsibity (scoping) is actually a form of state, but one that doesn't really fit in the model layer. Misunderstanding the role of controllers often lead people to put all non-ORM state in the controller itself, for the sake of "consistency" (a pattern colloquially known as "fat controllers").

While fat controllers aren't necessarily bad per se, they can lead to some problems if you're not careful with their lifecycles. As a rule of thumb, controller classes should never be instantiated from a view.

It's technically possible to have controllers that get reconsctructed by views on every redraw (using anonymous stateless objects is an example of it), but the extra abstraction layer provided by OOP classes lulls developers into the common OOP pattern of encapsulating state within the class itself.

Since controllers in Mithril modules are nothing more than Javascript constructor functions, they can be as thin or as fat as a developer wants. The problem begins when a developer starts holding state in fat controllers for convenience instead of putting that state in view-models, and then proceeds to instantiate the constructor function from a view. Typically in Mithril, controllers are only meant to be initialized once in their lifecycle, but view functions run every time an event is triggered. When a controller is initialized by the view, it resets its internal state, which is almost never what the developer wants. So just don't do it.

Another related issue that comes up often is incidental complexity arising from adding a controller for its own sake. This happens most commonly when someone has a list of things and they want to wrap each item in its own module. Remember that controllers are a scoping mechanism: items in a list are already scoped and ready to be consumed by views, so adding another layer of controllers adds unnecessary boilerplate.

If you're running into issues with managing the lifecycle of sub-components that represent items in a list, then you probably should consider [view model maps](mapping-view-models.html) instead. You can skip implementing the sub-module controller until your sub-module actually does need to be scoped on its own for another page where the sub-module exists but the list module does not.

---

### 4. Premature optimization

A relatively common mistake is creating gigantic DOMs, and then spending inordinate amounts of time trying to one-up the framework's rendering algorithm. The performance of all algorithms degrade as the size of data increases, and even the fastest algorithms can only run as fast as the hardware they run on. Rendering tens of thousands of elements on a page will be slow with any framework.

Rather than spending time fighting against the global nature of Mithril's virtual dom diff algorithm, it's usually more productive to think of ways to reduce the size of the DOM. Large tables are a classic example: their rendering performance degrade linearly as more rows and columns are displayed, but no human being can reasonably wade through thousands of rows filled with tabular data. Rather than spending time fighting the rendering algorithm (which is not even the culprit of the slowness), it's a lot more productive to implement pagination and search / filtering: doing so improves performance (both on redraws AND on page load), AND it improves usability as well.

---

### Conclusion

Many mistakes that people make when starting out with Mithril are often related to years of old habits, or by lack of experience with javascript (or even programming in general). While there will inevitably those who misunderstand one or another small aspect of Mithril itself, I think the minimalist nature of the framework and the amount of documentation and public forums available are sufficient enough that the only problems left to pay attention to are those related to the general programming discipline. I hope this article helps you hone high-level application development skills, regardless of whether you end up using Mithril ten years from now or not.