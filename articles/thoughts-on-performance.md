## Thoughts on performance

These past few weeks, there's been a lot of activity in the Mithril [mailing list](https://groups.google.com/forum/#!forum/mithriljs) and in the [issue tracker](https://github.com/lhorie/mithril.js/issues) surrounding performance. It kinda started with [this link](https://groups.google.com/d/msg/mithriljs/l8CoZuqfH20/zrzozkh0XJkJ), a benchmark of various virtual DOM operations, in which Mithril was doing poorly compared to other virtual dom libraries.

This naturally surprised a lot of the community since Mithril had been shown to perform well on [an earlier TodoMVC benchmark](http://matt-esch.github.io/mercury-perf/) (lower is better). As it turns out, [according to the author of the vdom benchmark, the metrics he was using are bad](https://github.com/localvoid/vdom-benchmark/issues/3), but nevertheless, members of the Mithril community started tinkering with Mithril's codebase and we now have a whole bunch of performance improvements in various stages of progress (some landed, some still being tuned), and the end result is that thanks to the efforts of G00fy-, Alex Galays and others, the next release of Mithril will fix weaknesses that made it choke on that benchmark, and we'll have a faster framework. Big shout out to everyone who is contributing!

But anyways, all of the talk about performance made think a little bit about performance in general, and it made me remember my foolish younger self, who would naively try to optimize code that really didn't need it. Hopefully you know better, but in any case, read on.

---

### When does performance matter

Obviously performance improvements in a framework are always welcome.

One might be tempted to think that optimizing a framework falls under the category of premature optimization, and that Donald Knuth's "Premature optimization is the root of all evil" quote is wrong. After all, all the work that goes into optimizing a framework happens before even a single line of your code runs, right?

But the reality is that a lot of the time, performance only starts mattering late in the game. Prototype.js used to be a major Javascript framework, but one of the defining moments for jQuery was release [1.1.3](http://blog.jquery.com/2007/07/01/jquery-113-800-faster-still-20kb/), which introduced a 800% (!) performance improvement over its previous version, effectively bringing the performance topic to the center of the stage for selector engines.

But by then, there were several players in the arena (Prototype, jQuery, MooTools, Dojo, to name a few), and the semantics of CSS selectors were well established.

One could argue that a similar thing happened with browsers themselves, when Chrome came into the picture with its V8 engine, basically forcing all the other browsers to up their performance games. By that time, the semantics of the Javascript language were also standardized.

What these examples illustrate is that performance optimization happens *late*, when the race of who has better features starts to stagnate.

---

### Performance isn't a vaccuum

In corporate projects, there's a similar trend of lateness: requirements change, deadlines loom, and performance optimization efforts are things that you are forced to do in the rush to get ready to ship.

It's often possible to get around a performance problem by changing your approach altogether. An example of this can be found in the [Mithril docs](http://lhorie.github.io/mithril/optimizing-performance.html): if your user does not need to be innundated with data in a grid, then taking steps to decrease cognitive load (e.g. paginating, filtering, etc) will also make the performance problem go away. Interestingly, when we have the foresight to mitigate cognitive load of a huge grid, we call it good usability design. When we don't have this foresight, then it's a performance problem. And it happens late because the lack of foresight leads to building something naively, and the problem only becomes apparent after dumping a bunch of data through the system.

We can say that implementing pagination and filtering is optimizing early, but remember that the problem only became apparent in hindsight. Religiously applying this optimization to every new grid can add another problem: complexity where it's not needed.

At my previous job, we had a peculiar case of this: one mission critical view was a fully dynamic grid that could be filtered in every conceivable way, so that people could filter not only rows but also columns. It was an extremely flexible interface for sure, but it was also nearly impossible to maintain. The solution? It turned out that using highly-specialized Trello-style views allowed for effective slicing and organizing of data for important use cases.

It's interesting to note that it takes some lateral thinking to go from a performance problem to a usability problem, and similarly to go from a complexity problem to a usability one.

Sometimes you can feed parameters back from your performance problem into your solution - iterating through usability improvements, for example. Sometimes the spec is too strict and you don't get too much wiggle room. But the key is that by the time an effort to optimize performance starts, you should have very concrete requirements and concrete goals.

When we try to naively tackle performance early - think perf'ing if statements vs switch statements in some random place in the codebase - we're effectively doing the same as the fully dynamic grids from my previous example: It adds complexity but it doesn't necessarily improve anything. You need to have a bigger picture to macroscopically measure the impact of a change. If there's no competition to beat, if the user can't notice the speed boost, performance optimization can be a waste of time and a creator of code debt.





