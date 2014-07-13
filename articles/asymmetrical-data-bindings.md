## Asymmetrical data bindings

The other day I got a request that Mithril should have a `$` tool. You know, like jQuery. At first glance, it may seem like a very backwards request, after all the whole point of frameworks like Mithril is to avoid the DOM puppetry that makes jQuery code hard to maintain. But digging deeper, it turns out that there's an interesting problem here that ended up becoming overlooked by bigger frameworks.

Consider that you have a form and all you want to do is use it the way HTML forms were intended to: you fill out fields and then submit the data.

With jQuery, the data flow would involve fishing out the values for the inputs with `serialize` or manual DOM queries and `val` calls. As I mentioned, this type of puppetry code often ends up becoming hard to maintain, but as it turns out, it's actually pretty efficient, since there's only the cost assembling the data for the ajax request once.

With frameworks like Angular, we instead sync up the data from the DOM via bi-directional bindings, which essentially updates a Javascript object on the fly every time a DOM event fires. Because Angular (and most frameworks) do this for us under the hood, the result is the typical adage of "programmers knowing the value of everything and the cost of nothing". But nonetheless, the cost of updating things on every keystroke is there, and unbeknownst to the application developers, there's actually a whole lot of hidden supporting code to run auto-redrawing.

The problem with out-of-the-box bi-directional bindings is that their very intent of hiding complexity also prevents us from getting control over the underlying mechanisms. The defaults that the framework provide us are optimized for robustness, and this comes at a cost on the flexibility and performance dimensions.

### Enter asymmetry

Mithril, being a minimalist framework, doesn't offer traditional bi-directional binding utilities out of the box. And as it turns out, they are not necessarily the best fit for our use case anyways. Here's a snippet to illustrate:

```javascript
m("form", [
	m("input", {oninput: m.withAttr("value", ctrl.user.first), value: ctrl.user.first()}),
	m("input", {oninput: m.withAttr("value", ctrl.user.last), value: ctrl.user.last()}),
	m("input", {oninput: m.withAttr("value", ctrl.user.email), value: ctrl.user.email()}),
	m("button", {onclick: ctrl.submit})
]);
```

As you can see, there's a lot of repetition and a whole lot of events firing during the course of filling out this form. Implementing bi-directional bindings in Mithril makes it blindingly obvious that a lot of bindings yield a lot of code, which waste a lot of CPU cycles. There's no magic shielding us from this fact and then biting us in the butt later.

Fortunately, we can do better. Our jQuery experience has taught us that there are many ways to improve performance when there are lots of DOM event handlers. Using less spammy events (say, `onchange` instead of `oninput`) is one example that is trivial to implement in Mithril. Another more interesting example is to use the browser's **event delegation system**.

As it turns out, with Mithril, this is also simple to accomplish: just attach an event handler on a parent and handle the event object there:

```javascript
//data binding helper function
function binds(data) {
  return {onchange: function(e) {
    data[e.target.name] = e.target.value;
  }};
};

m("form", binds(ctrl.user), [
  m("input[name=first]", {value: ctrl.user.first}),
  m("input[name=last]", {value: ctrl.user.last}),
  m("input[name=email]", {value: ctrl.user.email})
]);
```

As you can see in the code above, we created an *unidirectional binding* called `binds` which syncs the controller object with the DOM values whenever a `change` event is triggered (as opposed to spamming the `oninput` event like we saw earlier). The event handler itself is also quite simple: DOM events propagate through the DOM tree, so we can simply intercept them at the `form` element and look at the event target to figure out where the event originated. And from there we can update our data model.

And as a bonus, the code is a lot cleaner and more readable.

For a lack of a better name, I'm calling these *asymmetrical data bindings*, because the code to control the flow of data from view to model is not symmetrical to the code that brings it from model to view.

Hopefully this article will encourage you to rethink what data bindings actually are, and remind you that there are often powerful tools waiting to be rediscovered when we drop down to lower abstraction levels.