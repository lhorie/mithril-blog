## The Uniform Access Principle

The [Uniform Access Principle](http://en.wikipedia.org/wiki/Uniform_access_principle) (UAP) is a concept that states that "all services offered by a module should be available through a uniform notation, which does not betray whether they are implemented through storage or through computation".

What this principle is saying is that an API should not break if one of its public interfaces changes from returning a simple value to returning a value from a computation.

Let's see what this means in practice. Consider this class:

```javascript
function User(options) {
	this.name = options.name;
	this.age = new Date().getFullYear() - options.birthdayYear;
};

var john = new User({name: "John", birthdayYear: 1980});
console.log(john.age);
```

It's pretty straightforward code: we define a user, who can have a name and age. We can set the name and a birthday year through the constructor, and then later we can modify the name and age by accessing the properties directly. But the smart reader will notice this is not very good code. In the real world, time passes, and John isn't going to be 30 years old forever.

We all know bugs happen and requirements change, so fixing this type of issue is a fact of life. But the real underlying problem here is that changing the implementation to be correct requires us to change the API of the User class:

```javascript
function User(options) {
	this.name = options.name;
	this.age = function(age) {
		var now = new Date().getFullYear()
		if (age) options.birthdayYear = now - age
		return now - options.birthdayYear;
	}
}

var john = new User({name: "John", birthdayYear: 1980});
console.log(john.age()); //notice this is now a function call
```

That might not look like a big deal, but consider that this is a very trivial example. In a real application, the rules that govern an entity's field could change in any dimension, and the entity might be used in hundreds of different places in the codebase.

### Enter getters/setters

In enterprise ecosystems with static typing, you can find IDEs that can do automatic refactoring of code, but this type of analysis is extremely difficult to do in dynamic languages like Javascript (especially once you start considering things like `new Function` and string-based property access).

The next best thing is to have support for getter-setters baked right into the language. But as it turns out, getter-setters in Javascript have a long and ugly history. [Here's an article from 7 years ago](http://ejohn.org/blog/javascript-getters-and-setters/) that claims getters/setters were *starting* to become noteworthy. Today, that syntax is [non-standard and not recommended for use in production](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineGetter). Instead we have [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty), which doesn't work corrrectly in IE8 and below (i.e. it's not production-ready either). In short: a decade has passed and we still don't have proper support for getters/setters!

Fortunately, there's another way to go about getters/setters: getter/setter methods. You might not have been aware, but you probably have used them before in Javascript:

```javascript
var value = $("input").val(); //getter

$("input").val(value); //setter
```

Mithril provides simple getter/setter methods via `m.prop` and, in addition to the regular getting and setting of values, they can also be used as a functional composition tool. Here's an example of a getter/setter function being used to implement bidirectional data binding:

```javascript
var prop = m.prop("hello");

prop("foo"); //setter

var value = prop(); //getter

m("input", {oninput: m.withAttr("value", prop), value: prop()});
```

The last line passes `prop` as an argument to the higher-order function `m.withAttr`, which creates an event handler that calls `prop` as a setter. The `value` property is assigned by simply calling the getter. In a ironic way, this technique - that could be done with Javascript a decade ago - is far more powerful than if we did have getter/setter syntax baked into the language.

But let's go back to the original topic: getters/setters are an effective mechanism to implement the Uniform Access Principle in classes.

In practical terms, this means we can just implement our User class using `m.prop` in order to achieve UAP. Here's what the original broken class would look like:

```javascript
function User(options) {
	this.name = m.prop(options.name);
	this.age = m.prop(new Date().getFullYear() - options.birthdayYear);
}
var john = new User({name: "John", birthdayYear: 1980});
console.log(john.age());
```

Now if we need to modify the implementation to fix it, we no longer need to break the User class' API:

```javascript
function User(options) {
	this.name = m.prop(options.name);
	this.age = function(age) {
		var now = new Date().getFullYear()
		if (age) options.birthdayYear = now - age
		return now - options.birthdayYear;
	}
}
var john = new User("John", 1980);
console.log(john.age()); //same API as before
```

### Bonus

One last thing: you might have noticed that the class creation idiom we've been using in this article is using an `options` argument. This is the same best practice we use when authoring libraries with customization options. And this same pattern allows us to automatically integrate our class to `m.request`, so we can get UAP out of the box from our web services' POJOs:

```javascript
var users = m.request({method: "GET", url: "/api/users/", type: User});
```

Notice that we're passing `User` as a `type` option into `m.request`. This passes the data items from the web service as an argument to the User class, so that when the AJAX response above resolves successfully, the `users` getter/setter function will contain a list of User class instances. Assuming the web service returned a list of objects with `name` and `birthdayYear` fields, we could then access the properties of the User class instances in the view using getter/setter syntax:

```javascript
users().map(function(user) {
	//notice `user` is an instance of our `User` class
	return [
		m("div", "name:" + user.name())
		m("div", "age:" + user.age())
	];
})
```

And, of course, as we saw earlier, modifying the internal implementation of the User class requires no major refactoring of the rest of our code.

In short, by simply structuring our plain vanilla Javascript classes using best practices and using `m.prop` (or any getter/setter function), we can also get the benefits of UAP for better separation of concerns and refactorability.