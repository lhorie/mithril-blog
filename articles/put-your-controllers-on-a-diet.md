## Put your controllers on a diet

Many developers have been conditioned by their frameworks to think that the model layer should only hold classes that represent database tables, and that controllers are the correct place to put business logic.

But as it turns out, in the original MVC paradigm, [business logic is meant to live in the model layer](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller). Controllers are meant to be merely a channel that orchestrates communication between the view and model layers.

Here's a contrived example to illustrate:

```javascript
//model
var form = {
	getData: function() {
		return {name: m.prop(""), age: m.prop(""), saved: m.prop(false), error: m.prop("")}
	},
	setData: function(data) {
		return m.request({method: "POST", url: "/user", data: {name: data.name(), age: data.age()}})
			.then(data.saved.bind(this, true), data.error)
	}
};

//controller
form.controller = function() {
	this.data = form.getData();
	
	this.save = function() {
		form.setData(this.data);
	}.bind(this)
};

//view
form.view = function(ctrl) {
	return m("form", [
		m("input[placeholder=name]", {oninput: m.withAttr("value", ctrl.data.name)}, ctrl.data.name()),
		m("input[placeholder=age]", {oninput: m.withAttr("value", ctrl.data.age)}, ctrl.data.age()),
		m("button", {onclick: ctrl.save}, "Save"),
		ctrl.saved() ? "Saved!" : "",
		ctrl.error() || "" // show error if any
	]);
};

m.module(document, form);
```

Here, the call in the last line `m.module(document, form)` in the view layer tells the controller that the view needs to be initialized. The controller then tells the model layer to make data available. Once the data is available (which is instantaneous in this case since we're pulling a blank data structure from memory), Mithril then triggers the rendering of the template.

In a similar fashion, clicking the button calls the `save` method in the controller, which in turn calls `setData` in the model. This time, once the AJAX request completes, the code updates the value of the `saved` flag in the model, and then Mithril triggers a redraw of the template to display the success message.

Note how all the data is neatly tucked in the model layer. In this example, I'm purposely using a pattern that ties the model data very closely to the UI schema - what is known as a **View Model**. From an MVC point of view, a view model is still a part of the model layer because its primary function is to handle data - data that ties closely to the UI structure, but still data.

### The road to hell

Here's a common variation of the example above. It fundamentally misunderstands the intent of the pattern above and puts the model responsibilities directly in the controller:

```javascript
var form = {};

//controller
form.controller = function() {
	this.data = {name: m.prop(""), age: m.prop(""), saved: m.prop(false), error: m.prop("")}
	
	this.save = function() {
		m.request({method: "POST", url: "/user", data: {name: this.data.name(), age: this.data.age()}})
			.then(this.data.saved.bind(this, true), this.data.error)
	}.bind(this)
};

//view
form.view = function(ctrl) {
	return m("form", [
		m("input[placeholder=name]", {oninput: m.withAttr("value", ctrl.data.name)}, ctrl.data.name()),
		m("input[placeholder=age]", {oninput: m.withAttr("value", ctrl.data.age)}, ctrl.data.age()),
		m("button", {onclick: ctrl.save}, "Save"),
		ctrl.data.saved() ? "Saved!" : "",
		ctrl.data.error() || "" // show error if any
	]);
};
```

This pattern is common partly because some frameworks have a very liberal interpretation of MVC which encourages pretty much all logic to live in controllers. There's also a lot of confusion among developers as to what MVC actually means, and the existence of patterns like MVVM and MVP causes even more confusion.

The code using the pattern above is shorter, yes, but this is a misleading gain: this code is also more tightly coupled, and therefore harder to scale and maintain down the road.

### Increasing complexity

Let's increase the complexity of our example a little bit to see why the shorter code is bad: let's add a bit of validation.

Ignoring for a moment that we'd never store an "age" field into the database, we could still validate it to ensure it's a positive number.

To add validation in the original example, we change the model method code:

```javascript
setData: function(data) {
	return m.request({method: "POST", url: "/user", data: {name: data.name(), age: data.age()}})
		.then(data.saved.bind(this, true), data.error)
}
```

To something like this:

```javascript
setData: function(data) {
	if (parseInt(data.age()) <= 0) data.error("Age must be a positive number!")
	else return m.request({method: "POST", url: "/user", data: {name: data.name(), age: data.age()}})
		.then(data.saved.bind(this, true), data.error)
}
```

And there's the problem with the controller taking the role of the view model. While in the first example, this `if`/`else` validation structure is neatly contained in the `setData` method, in the second example, it ends up being inline in the controller.

What that means is that, as the application grows, any time you need to deal with the `age` of a `user` entity, you don't have a single point of contact for validating the age - you end up copying and pasting the validation snippet everywhere (or get potentially invalid data if you forget). And when validation rules change (yes, *when*, not *if*), you end up being forced to audit a whole lot more code than if the validation code was contained within a single point of contact in the model layer.

A clever reader might retort that the view model in our first example is no better, because different parts of the application would likely use different view models, and the duplication of code would still happen.

This is only true because I wrote the code in a very specific way in order to illustrate how code can evolve over time. The separation of concerns achieved by having a view model entity has another subtle but important purpose: keeping the validation in a `setData` method that is exclusively about users means that we can be sure there aren't other implicit dependencies at play via closures and fall-through state in the controller scope. This is an important property for code to have, because it means we can refactor the model layer code more easily to separate the *user* concern away from the *UI view model* concern.

In a real life application, we might get a change request to add a section to the form about a completely unrelated thing, or maybe a request to redirect the user to another page automatically after saving successfully. The code to handle this orchestration might involve touching several view models and might issue commands to the framework to handle the redirects. If numerous view models - validation code and all - get mixed with orchestration code in a big monolithic controller function, they just become extra mental baggage that slows down our refactoring efforts (or prevents it altogether).

Having the code already semi-refactored in a view model entity, we can then apply the OOP stuff we learned in school: instead of calling a naked `m.request` for a user directly from the form view model entity (which sounds like an obviously dumb idea as soon as we say it out loud), we can create a self-contained `User` class and use it in the view model entity to manage user state and validation, without getting bogged down by the controller's redirect logic and other unrelated stuff.

In other words, the first example is closer to an ideal codebase than the second, and therefore takes less effort to refactor, and is less likely to end up in code rot.

### Conclusion

It's very rare that we'll write perfect code on our first try, especially with tricky business logic taking most of our mental power (and the looming deadlines filling the rest of our brains with stress), but it's very common that we'll have to maintain the resulting code through rounds and rounds of maintenance and changes. It's very important to have a solid understanding of what logic is tied closely to what data, so we can achieve DRYness and separation of concerns more effectively, rather than slicing the code in the wrong dimensions and then hitting a wall of code rot a few months down the road.

Moving state machines out of controllers is a good start. Acknowledging that the model can have both business data and UI state data (and that the two are separate things) is another step in the right direction.

However, we should always be mindful that these are techniques to achieve a goal, NOT dogmatic golden rules: blindly separating everything into small boxes doesn't automatically makes code good, and in fact can be detrimental if we separate things that are actually meant to be together. This is precisely the misunderstanding that yields well-intentioned but problematic code with self-contained model classes, and self-contained controllers holding validation code for said classes.

Separation of concerns isn't itself an end goal. Keeping our code refactorable as it grows in complexity is what we really want to achieve.
