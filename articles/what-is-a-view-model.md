## What is a View Model

*This article was adapted from an essay in the mailing list*

Last week we saw how we can animate things with Velocity.js. A related topic that came up on the Mithril bug tracker (and that keeps coming up every once in a while) is the topic of *application* state (as opposed to *data* state). Today we'll explore that topic:

Let's imagine we have a button, and that when we click on that button, a panel shows up. When we click on the button again, the panel disappears. In jQuery, we can code this in an action-centered way: "on click, show". Mithril, however, (and for that matter, most MVC frameworks) encourages us to be data-centered: "if this flag is set, show". This means that when we are debugging, instead of having to use PhantomJS to emulate a user clicking through our app to get to a specific state in our application, we can always render the exact UI state that we want if we have our data setup in just the right way. And since data is easy to manipulate via plain javascript, the entire testing workflow is also a lot easier as a result.

But a "this panel is open" flag is not really a "model" value in the traditional sense. It doesn't map to "Users" or "Projects", or to anything else that we might want to store in a database. It's merely data *about* the UI. This type of data is also known as *application state*.

Many people get confused when they need to decide where this application state should go. Should it go in the controller? Should it be hidden in the view layer behind a helper function?

The answer is that it is **state** after all, so it should be in the model layer.

The rationale for this goes back to the definition of MVC: 

- the Model layer is responsible for application data, business rules and logic.
- the View is responsible for displaying data
- the Controller is a mechanism that translates user input into commands for the model layer

---

### A little bit of history

In classic MVC (the original Smalltalk one), the Model layer notifies the view of changes to data; the view can send messages to the controller to tell the app to do things; the controller then manipulates the model, which then notifies the view, ad infinitum. The controller may also modify the view without assistance from the Model layer (for example to show a loading icon.) In this original implementation, all layers could contain code: the view could subscribe to model events via the observer pattern, and likewise, the model could trigger events via the same mechanism.

Since then, a lot of twists have been made: we adapted the pattern from the realm of desktop apps to the realm of server-side architectures, and from there to thick client-side architectures. Somewhere along the lines, we started to conflate the View layer with HTML, the Model layer with database tables, and reached the conclusion that anything that is neither HTML nor SQL related must be part of the Controller layer.

In server-side architectures, application state largely became conflated with URLs (so much so, that POST-only URLs are still considered bad practice, since they make it hard to reach certain states). Client-side MVC became prominent precisely because URLs were not enough to express all possible states in heavily AJAX-driven applications. So as complexity grew, we started to see a sort of limbo with application state that didn't fit into a URL, and that didn't really fit anywhere else either (given the cookie-cutter molds that frameworks provided us).

One of the things I'm trying to do with Mithril is encourage people to go back to the basics and realize that a lot of the assumptions and cloudiness surrounding MVC is actually wrong: the view layer isn't HTML-only, the model layer isn't supposed to be solely about ORM classes, controllers aren't supposed to be a pool where we dump things that we don't know how to fit into the rest of the framework.

Going back to the topic of application state: state is just data. *Meta* data, but still data. Here's an example to illustrate that point: sortable tables. You have a table full of data, you click on a header, it sorts by that header. What if you want to permalink this configuration? Often, we modify the app so that the sorting options are part of the URL. But what if we need to embed this table in another page that makes use of the URL for something else? Or what if the URL is too long? We can keep refactoring and refactoring for every new requirement, but at the end of the day, you have to save the sorting options somewhere.

Of the three layers in MVC, the Model is the one that we really should be using for that. Note that the model layer doesn't necessarily need to save things to a database on the server. If we now go backwards cutting off requirements, we can make a model entity that saves to localStorage, or heck, even to just memory, if the application state is transient enough to be discardable at page unload.

If we structure our code this way from the beginning, then we have a clear API to use the application state in our controllers and views, and we can isolate the exact persistence implementation details to the model layer.

---

### Enter view models

Some newer frameworks (most notoriously .NET MVC) introduce the concept of "View Models", i.e. Model layer entities that exist exclusively to store UI state. They are different from traditional MVC models because by definition, they are tightly tied to specific view components.

Using a singleton is perhaps the simplest way of implementing a View Model:

```javascript
app.widget1State = {isPressed: m.prop(false)}

/*...*/
m("button", {
  onmousedown: function(){ app.widget1State.isPressed(true) },
  onmouseup: function(){ app.widget1State.isPressed(false) }
})
```

I use `m.prop` above to ensure we can refactor the View Model (here, the `m.prop` getter-setter is an in-memory data storage mechanism; we could later replace it with a custom getter-setter function that saves to localStorage, or the database server, or what have you, because it follows the [uniform access principle](the-uniform-access-principle.html))

View Models are meant to store application state (e.g. if there's a field and a cancel button, and we need to store the temporary value while editing), and regular Models are meant to store data state (e.g. the value after you save that field). You don't really want to store stuff like `valueBeforeEdit` and `currentValue` in your data model class; these are details that only exist because of the UI requirements for a cancel button and are not something that your data model should care about. Similarly, the sorting options of our sortable table and the flag for whether a panel is visible are both cases of application state, so they should live in a view model.

---

### Scoping view models

Normally, for complex pages, it might be tempting to make one big view model to drive the whole page, but it often makes more sense to scope one view model to each component on a page. It's not uncommon that you might need to reference one view model from an unrelated component, but these are uni-directional desired dependencies.

For example, if our sortable table has edit buttons that open up a modal dialog w/ a form, these buttons might set a value in the form's view model. However, this dependency is *desired* because we *want* the form dialog to be tied to the button. And since a view model is largely a data storage mechanism, we can still use it in other unrelated scenarios without worrying about the sortable table view model.

Having a single monolithic view model makes it harder to pull out components and reuse them elsewhere without bringing a lot of unrelated baggage with it.

---

### Conclusion

Hopefully this essay can help you figure out where to put what kind of code. A lot of it is more a matter of understanding the MVC pattern and organizing the code in a pragmatic way, as opposed to inventing a "Mithril way" of forcing things to work around dogmatic assumptions that we bring over from our experiences with other frameworks. At the end of the day, the MVC pattern is supposed to be helping us, not getting in our way.