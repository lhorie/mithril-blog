## Saving is hard

When we first come across the idea of RESTful web services over HTTP, the first thing we usually learn is that, instead of defining a URL like "/getThings/", the `GET` method is the way to express that we want to get things from the server, e.g. (`GET /thing/`). `DELETE` deletes things, so the rest of the HTTP methods should all be more or less the same deal, right?

As it turns out, inserting and updating things are kind of complicated: there is the `POST` method that we've all used for both purposes in the past, and then we discover there are also `PUT` and `PATCH`.

---

### POST

The HTTP spec is a bit of a blabbermouth. Here's what it says about `POST`:

```
The POST method is used to request that the origin server accept the entity enclosed in the request as a new subordinate of the resource identified by the Request-URI in the Request-Line
```

What this means is that `POST` is meant to be used for creating entities as part of something else. Think of that something as an Array, and of `POST` as of its `push` method: when we don't know the index which we are putting our item at, we `push()` it and get the array index back that we can use to identify our item later. Same with `POST`: when we don't know the ID of the entity, we `POST` to the list so we can find out the ID from the response. Then we can `GET` the entity by ID later.

For example, let's say an app deals with users, which are represented by the URL `/users/`. We can `POST` a new user to this URL even if this user entity does not have an ID. The response should tell us an ID that will let us later find it, e.g. `GET /users/1`

We are *not* supposed to send a `POST /users/1` request if we are looking to update the user whose ID is 1

```javascript
//assuming the list of users is empty
//create new user in the list of users
var newUser = {name: "John", email: "johndoe@example.com"}
m.request({method: "POST", url: "/users/", data: newUser})
	.then(function(response) {
		console.log(response) // {id: 1, name: "John", email: "johndoe@example.com"}
	})

//retrive the  user
m.request({method: "GET", url: "/users/1"})
	.then(function(response) {
		console.log(response) // {id: 1, name: "John", email: "johndoe@example.com"}
	})



//the following is INCORRECT usage of POST
var newUser = {id: 1, name: "John", email: "johndoe@example.com"}
//notice ID in the URL, so this request should return an error
m.request({method: "POST", url: "/users/1", data: newUser})
	.then(function(response) {
		console.log(response) // this should not get called
	}, function(error) {
		console.log(error) // "cannot add user as child of itself"
	})
```

---

### PUT

Here's what the spec says about `PUT`:

```
The PUT method requests that the enclosed entity be stored under the supplied Request-URI. If the Request-URI refers to an already existing resource, the enclosed entity SHOULD be considered as a modified version of the one residing on the origin server. If the Request-URI does not point to an existing resource, and that URI is capable of being defined as a new resource by the requesting user agent, the origin server can create the resource with that URI.
```

This means `PUT` is meant to be used to update or insert (aka "upsert") into whatever is represented by the URL. Again, using the Array analogy, `PUT` is somewhat like `list[i] = value`, where `i` is explicitly in the URL. This operation may overwrite anything that is already there, or it might add a new thing if nothing exists at that index. An important implication is that just like assigning `list[i] = value` multiple times always results in the same thing, `PUT` is also not supposed to have side effects.

For example, we can send a `PUT /users/1` request to add or update a user whose ID is 1.

```javascript
//assuming the same list of users as before
//create new user in the list of users
var newUser = {id: 2, name: "Mary", email: "marydoe@example.com"}
m.request({method: "PUT", url: "/users/2", data: newUser})
	.then(function(response) {
		console.log(response) // {id: 2, name: "Mary", email: "marydoe@example.com"}
	})

//update the user
m.request({method: "PUT", url: "/users/2", data: newUser})
	.then(function(response) {
		console.log(response) // {id: 2, name: "Mary", email: "marydoe@example.com"}
		//notice no data has changed
	})

//the following is INCORRECT usage of PUT
var newUser = {id: 2, name: "Mary", email: "marydoe@example.com"}
//notice URL has no ID, so this request should return an error
m.request({method: "PUT", url: "/users/", data: newUser})
	.then(function(response) {
		console.log(response) // this should not get called
	}, function(error) {
		console.log(error) // "cannot replace list of users"
	})
```

---

### PATCH

```
The PATCH method requests that a set of changes described in the request entity be applied to the resource identified by the Request-URI. The set of changes is represented in a format called a "patch document" identified by a media type. If the Request-URI does not point to an existing resource, the server MAY create a new resource, depending on the patch document type (whether it can logically modify a null resource) and permissions, etc.
```

`PATCH` is an interesting method: it is meant to be used as a mechanism to batch operations. In our Array analogy, it's similar (but not analogous) to `splice`. Instead of accepting just data, it accepts a document that contains instructions on what to do with the attached data. It can add, delete and modify items to the list. The spec doesn't require it to be idempotent (i.e. it can perform irreversible actions, such as deleting items, sending out emails or making a purchase), but it requires that all the operations requested must be done atomically, i.e. either all of them succeed or the entire batch must be rolled back and rejected, no partial updates allowed.

```javascript
var operations = {
	add: [
		{name: "Jane", email: "janedoe@example.com"}
	],
	upsert: [
		{id: 2, name: "Mary", email: "marydoe@example.com"}
	],
	delete: [
		{id: 1}
	]
}
m.request({method: "PATCH", url: "/users/", data: operations})
	.then(function(response) {
		console.log(response)
		/* notice "John" was deleted
		[
			{id: 2, name: "Mary", email: "marydoe@example.com"},
			{id: 3, name: "Jane", email: "janedoe@example.com"}
		]
		*/
	})
	
```

Notice that if we run this example request a second time, it would not add another user called Jane (and it would not attempt to update Mary), because there's no user with ID = 1 to delete, and therefore the entire set of changes is required to be rejected.

---

### Why not just use POST everywhere?

One might wonder what is the point of having so many different ways of saving data. What's wrong with just using POST for everything like we've always been doing?

When your application's client side code is the only consumer of your web services, you can get away with just doing whatever you want because reinventing the wheel as you go has a lower cognitive load than consulting the HTTP specs all the time. However, when we're talking about public web services that are usable by other people, it's important that they can discover what is doable and how. If they need to consult your documentation (assuming you have one!) to figure out whether they should send a request to `/getusers/` or `/users/get` or `/search?type=user`, it causes the same type of cognitive load as it would take you to learn the HTTP spec. Obviously in that situation it's better for everyone to learn the HTTP spec once, than everyone having to learn the arbitrary vocabularies of every possible web service that they might need.

More importantly, by learning the HTTP spec, you can become aware of things that your perhaps simplistic application did not think about, and you can fix them to make your code better. One example that is frequently neglected: does your web service have support for saving multiple items at once? (e.g. how would you do the checkboxes in the gmail list?)

Another reason to understand the spec is to become aware that HTTP verbs don't translate perfectly into the naive idea of CRUD (create/read/update/delete). With this knowledge, you can understand that autogenerated model layers might limit what you can do by attempting to map the business logic to an over-simplistic view of the world. Hopefully, you'll also start to understand that a model layer that exposes the transport details to controllers (by merely giving you a class with renamed methods like `.update()` for `POST`) isn't all that helpful to you, especially if said class methods do too much magic and it's hard to refactor away from them.

Ultimately, you'll want to ensure your model layer API expresses your business needs first and foremost, as opposed to trying to conform to some arbitrary programming design pattern for its own sake. The model layer is an abstraction layer: you want its API to be more expressive than just wrapping CRUD with different names. You want to be able to do things that don't fit a simplified CRUD mold, and you don't want to reinvent the wheel and relearn all the lessons that the HTTP spec already ironed out years ago. Making that leap takes a little more brain power because it actually forces you to think about good API design, but in the end the effort pays off: you get better separation of concerns and modularity, which translate to shorter, easier to maintain code.