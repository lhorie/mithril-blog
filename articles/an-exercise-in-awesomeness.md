## An exercise in awesomeness

*May 14, 2014*

James Long wrote a [pretty nice article](http://jlongster.com/Removing-User-Interface-Complexity,-or-Why-React-is-Awesome) about what makes a virtul-DOM based framework like React awesome.

Since Mithril uses the same templating mechanism, I thought it would be a good exercise to re-implement some of the more interesting examples with Mithril to see how they compare.

James used a made-on-the-spot 250-line toy library called "Bloop" to illustrate how React works. Mithril in its entirety - including the router and promise systems - is actually not a whole lot bigger (~500 lines) and does virtual DOM diffing like React (and it takes care of figuring out when to redraw, as opposed to spamming on requestAnimationFrame)

### Tabbed UI

This example aimed to demonstrate the idea of storing data in a centralized location. I've actually talked about this idea - a pattern that is known as view models in some circles - in the [mailing list](https://groups.google.com/d/msg/mithriljs/WOvJARwmOYA/ovA_HVTawnQJ). It's a great way to harmonize application state back into the familiar MVC design pattern. [You can see the port of the example in action here](http://jsfiddle.net/kHaRa/1/)

Note we are using the same concepts of passing data down the component tree via *props* (which are really just data objects being passed as function parameters), and passing data up via events (i.e. we pass down event handler references as *props* and bind the handlers locally in the appropriate component via partial application)

You can find James' code [here](https://gist.github.com/jlongster/3f32b2c7dce588f24c92) for comparison. A few things are slightly different: 

- Instead of `if` statements in the `app` template, we're using a variation of `app.choose`, which I described in [this article](getting-over-a-fear-of-turing-complete-templates.html). 

- Instead of defining `randomizeColor` and `reset` as local instance methods in the `Settings` component, we're defining these methods in the model layer (i.e. we're using a more classic MVC style, which allows us to centralize and reuse logic).

- I put the textarea with the JSON data in the about tab. It updates the data when you change its value just like the one inlined in the article.

- We don't actually need full blown components in Mithril: since the Bloop components are stateless, templates are enough to modularize our code in the same way as in James' article.

Because data is centralized and the code structure is largely the same, it's possible to do undos in the same manner that was outlined in the article. The code for that example is pretty big and I don't have the time to port it over, so I'll leave it as an exercise to the reader to try to implement it Mithril. If anything, that's a good exercise to solidify an understanding of the data flow concepts from the tabs example.

### Occlusion culling

This example shows how we can implement efficient templates that render only what is visible on screen. [See it in action here.](http://jsfiddle.net/7JNUy/1/)

I think the article didn't do this technique enough justice in terms of highlighting real world applications, but this is a really powerful technique that is relevant for things like infinite scrolling, deferring rendering of below-the-fold content to help breaking the [mobile 1000ms barrier](http://alistapart.com/blog/post/breaking-the-1000ms-time-to-glass-mobile-barrier) and making parallax sites snappy.

The Mithril code structure is largely the same, but without spamming on requestAnimationFrame. Instead we request redraws only the scroll event, and Mithril internally throttles these calls. One philosophical difference is that I place code related to `window.onscroll` / `window.innerHeight` in the model layer. This may seem unintuitive, but remember that `innerHeight` is being used as a *data source* that is updated asynchronously by `window.onscroll`.

### Conclusions

As the examples above show, it's relatively straightforward to use the componentization / data flow model that React employs, and we can employ all of the same techniques and insights in Mithril.

A recurring difference in philosophy is that React is very component-centric and OOP-driven, whereas Mithril code relies more on design pattern, with decoupled helpers (a style that is most commonly seen in the Lisp world). Personally, I believe the OOP approach can be detrimental sometimes, e.g. `randomizeColor` is more about the data than the widget that calls it, so tying it to the component instance makes it less reusable. Of course, both React and Mithril workflows can be adapted to look more like the other, so this is mostly just a question of expected defaults.

Some commenters on HN mentioned that React also lacks a canonical way of structuring non-view-related aspects (something that I believe Flux attempts to address). On the one hand, I do agree with the sentiment (and that's why Mithril provides model-level utilities), but on the other hand, there's only so much a framework can do when it comes to the model layer. This is where the programmer is supposed to put their analytical skills to work, and I think design patterns as blueprints for the implementation are more useful tools than opinionated implementations that force one or another pattern on us (ActiveRecords comes to mind).

We saw an example of that with my handling of `window.innerHeight`: the code is pretty much the same - the only thing that really changed was how we interpreted it in the context of MVC. I see design patterns as a way to map a logical mental model to an implementation, and as a tool to shorten code, NOT as a mold that we must implement with code so that more code can conform to it. This is the core philosophical difference between React's OOP-style approach and Mithril's.

Anyways, I hope this article provided a bit of architecture design background to the conversation. Like many who read James' articles, I'm very excited when looking at the possibilities that virtual DOM systems enable, and I didn't want to lose the momentum on my never-ending quest for a framework that truly gets out of our way.
