## Lessons learned from AngularJS

*May 4, 2014*

Some people have asked me what are the differences between [Mithril](http://lhorie.github.io/mithril) and [Angular](http://angularjs.org)

I actually [wrote about some of the high-level differences here](http://lhorie.github.io/mithril/comparison.html).

You might notice that on the Angular section, I go quite a bit more in depth than some other frameworks' comparisons.

As it turns out, I work with Angular a lot, so a lot of design decisions in Mithril come directly from my experience with it. In this article, I'll talk about some of the rationales behind Mithril's template design.

Angular uses what it calls *directives* to enrich HTML with functionality. Directives are essentially a mechanism that attaches functionality to DOM elements in an unobtrusive manner. Directives can be bound to elements, attributes or class names and provide a "free out-of-jail card" of sorts that allows developers to break out of Angular's environment and access the DOM directly. There are [dozens of directives](http://docs.angularjs.org/api/ng/directive) that come out of the box, and it's possible to create custom ones as well.

Well written directives really shine as consumable APIs: they allow developers to declaratively add rich functionality to a static HTML page: you can whip up a code editor just as easily as a native HTML textarea.

The main problem with directives is their sheer complexity: when writing a directive, you quick stumble across things like scope isolation and `$scope.$apply`, and the complexity only goes up when you start to look into more advanced concepts like transclusions, `$compile`, the `ngModelController`, etc. And complexity goes higher still when you need to debug "$digest already in progress" errors, or worse, the dependency graph of your app's watcher chain. Having written my share of non-trivial directives, I can attest to the difficulty of using the directive system for extending core Angular.

Another problem is that the readability and maintainability of some directives tend to fall apart because they try to map procedural Javascript onto declarative HTML. This problem manifests itself in many ways: 

-	**awkward creep of Javascript logic into templates**

	It's pretty common to run into scenarios like these:

	```javascript
	<div ng-class="{'text-success': item.value > 50, 'text-danger': item.value <= 50}"></div>
	```
	
	Some stuff is just downright [clunky](https://groups.google.com/d/msg/angular/7WY_BmFzd3U/Zd_jHnMu58YJ):
	
	```markup
	<input ng-model="search" />
	<table>
		<tr ng-repeat-start="item in (filtered = items | filter: search)">
			<td colspan="2">...</td>
			<td>...</td>
		</tr>
		<tr ng-repeat-end>
			<td>...</td>
		</tr>
	</table>
	<p>Showing {{filtered.length}} results</p>
	```
	
	I'll leave it as an exercise to the reader to look up how to do recursive templates in Angular (e.g. for tree views) for another example.

-	**lack of proper error reporting**

	Angular can do a pretty decent job with expression syntax errors, but because expressions are embedded in HTML, we don't get line numbers.
	
	A perhaps more serious problem is the dubious feature that makes view expressions [swallow errors altogether](http://jsfiddle.net/pusf3/). Angular allows this because of its aggressive rendering profile:
	
	```javascript
	function SomeCtrl($scope, someAsyncService) {
		//Angular renders once here
		$scope.greeting = "Hello"
		
		someAsyncService(function(data) {
			//and another time here
			$scope.data = data
		})
	}
	```
	
	```markup
	<div>{{greeting}}</div>
	
	<!--the null reference exception is swallowed here so the first render doesn't break-->
	<div>There are {{data.length}} things</div>
	```
	
	Another semi-related problem: this is a common debugging technique in Angular:
	
	```markup
	<div ng-repeat="item in items">
		...
	</div>
	
	<!--let's debug the `items` variable - this prints the JSON representation of the data-->
	{{items}}
	```

	It's surprisingly common to forget to remove a debug statement and the result can be far more embarrassing than it should be.
	
-	**leaky abstractions**

	Consider this snippet:
	
	```markup
	<div>{{item}}</div>
	...
	<ul ng-repeat="item in items">
		<li>{{item}}</li>
	</ul>
	```
	
	The variable `item` can mean different things in different places because of a programming language feature called [variable shadowing](http://en.wikipedia.org/wiki/Variable_shadowing).
	
	But instead of using Javascript's built-in system, Angular builds its own implementation, with some weird results:
	
	```markup
	<a href="" ng-click="flag = true">open</a>
	
	<div ng-show="flag">
		<a href="" ng-click="flag = false">close</a>
	</div>
	```
	
	Click on the `open` link, the `div` shows up. Click on `close`, it hides. Now let's say you want to use `ng-if` instead, maybe because you're finding yourself needing to use CSS nth-child selectors or as a performance optimization or whatever.
	
	```markup
	<a href="" ng-click="flag = true">open</a>
	
	<div ng-if="flag">
		<a href="" ng-click="flag = false">close</a>
	</div>
	```
	
	Now this [doesn't work](http://jsfiddle.net/54RXG/) as before. Considering that it is common to use the `ng-show`/`ng-if` feature when implementing lists or tables of big things with a fallback case for zero items, it's relatively easy to break completely unrelated parts of an app with a seemingly innocuous change.
	
-	**Performance**

	Another problem related to Angular's re-implementation of scope (among other things) is the steep performance degradation when things like grids grow past a modest size. Often things look ok w/ test data, but with production-level data volume, you are sudddenly forced to discover about Angular internal concepts like watchers, dirty checking, apply cycles, etc, or you need to do massively time consuming audits of the codebase in order to figure out the feasibility of adding the ng-bindOnce plugin, or maybe you need to completely rewrite a top-level ng-repeat to use the ng-grid plugin instead.
	
	It's extremely difficult to reason about Angular performance, and standard tools don't help very much.
	
Mithril takes lessons from my Angular experience and it takes a completely different approach: *it maps HTML onto Javascript*. This means that instead of having to retrofit control flow into a declarative syntax that was never meant to support it, we simply take advantage of the standard DOM API that ships with all browsers to create and update the HTML from Javascript instead, and let Javascript do the job of the control flow, variable shadowing, recursiveness, etc. Use the right tool for the right job, etc.

In addition to resulting in a *really* small code footprint (~3kb gzipped), this approach allows a much higher level of expressiveness much more easily. In a [previous post](http://lhorie.github.io/mithril-blog/building-a-seinfeld-app.html), for instance, I showed a few examples of how simple it is to add application-focused expressiveness to a Mithril template.

```javascript
//a 7x7 grid of checkboxes where the cell for the current day is highlighted
var view = function(ctrl) {
	return m("table", seven(function(y) {
		return m("tr", seven(function(x) {
			var index = indexAt(x, y)
			return m("td", highlights(index), [
				m("input[type=checkbox]", checks(ctrl, index))
			]);
		}));
	}));
};
```

The sample above illustrates that instead of having to use `repeat` and `model` directives and naked color hex values to make the computer do what we want, we can explicitly express that there are `seven` children in an element, that a cell `highlights` and that a checkbox `checks` - and we can implement these terms just as easily - they're just straightforward, transparent functions.

Because Mithril acknowledges that dynamic data binding in large systems is more procedural than declarative, we can leverage the full power of Javascript without getting tripped by [Greenspun's tenth rule](http://en.wikipedia.org/wiki/Greenspun's_tenth_rule), and without the need to learn framework-specific templating syntax that we'll probably not be using in 10 years.

But even though Mithril templates are ultimately plain Javascript, we don't necessarily need to sacrifice the familiar syntax of HTML in order to get the flexibility of Javascript: there's a nifty React-based transformer by Jonathan Buchanan [that allows us to write templates with plain HTML syntax](https://groups.google.com/d/msg/mithriljs/lGiNpog2mbc/ThZSdgw_nucJ).

We could also use Coffeescript instead, if that's your cup of, er, coffee.

The point is that in addition to having the refactoring power of a programming language available at no extra cost, we also get access to a wide array of tools: templates can be profiled granularly, minified, linted, unit tested *without the slowness of loading up PhantomJS*, etc. The "Mithril ecosystem" might still be in its infancy, but the Javascript ecosystem is huge and Mithril is ready to take advantage of it in ways that many frameworks can't even begin dreaming of.

Here's a cool example: we can use [Sweet.js macros](http://lhorie.github.io/mithril/compiling-templates.html) to make existing code faster for free, or even [create new extensions to the language](https://github.com/mozilla/sweet.js/wiki/Example-macros), if we're bold enough. The elusive power of Lisp macros is now all of a sudden something that can actually be used in our frontend day-to-day work - without the need to [learn a whole new language](http://artyom.me/learning-racket-1) or [learn about compilers](http://jlongster.com/Stop-Writing-JavaScript-Compilers--Make-Macros-Instead).

There are many other aspects of Mithril that are also worth mentioning. The rendering engine waits until controllers are fully done before redrawing instead of flickering incorrect states at every AJAX response. The routing system actually works with things like anchors (e.g. "back to top" links) and browser history lists (e.g. `Ctrl+H` in Chrome), instead of being, well, broken. The high performance is a result of a very aggressive take on the do-less-to-be-fast and the don't-reinvent-the-wheel mantras. The composability of the component system is rooted on the field of functional programming (rather than being an ad-hoc half-implementation) and thus it's mathematically sound.

All of these features have one thing in common: they originate from pain points from my experience with actually building non-trivial apps. Apps with fuzzy scope, top-down directed changes, ambiguous requirements, tight budgets and deadlines - you know, *real world* apps. At the end of the day, it's important for a framework to keep in mind that it doesn't exist for its own sake: rather than assuming an utopia where the developer has the luxury of deciding every aspect of an application's feature set, design and implementation, and where not-so-easy-to-implement things can be waved away with soft skills so that the developer can stay within the comfort zone of the framework, a framework must be prepared to take on the ugly reality of less than ideal workflows. 

It's not supposed to be up to a framework to limit what I [can and cannot do](http://stackoverflow.com/questions/9682092/databinding-in-angularjs), and it's not supposed to be [breaking](https://github.com/angular/angular.js/blob/master/CHANGELOG.md) high impact aspects of application space every other release.

These are things that you only really "get" if you're burned by them, and burned by them I have been. These lessons were part of every design decision and every line of code in Mithril, and are always part of the ongoing progress of the project: stability before new features, research before code (even for small-looking changes), regression tests, "it-is-not-done-until-it-is-documented" (and yes, things *do* get done), etc.

Anyways, I was only planning on talking about templating engines, but I guess things dragged on a bit. The point though is that Mithril scratches *a lot* of itches, not just in terms of just templating, or even just code: it does so for frontend application development as a whole.