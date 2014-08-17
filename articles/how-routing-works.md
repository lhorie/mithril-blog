## How routing works

Traditional routing is something most people understand fairly well: you click on a link, it takes you to another page. This new page has a different URL and it looks different from the one you were on.

Routing in single page applications (SPAs) aims to do exactly the same thing, but with one difference: the page doesn't actually reload from scratch. Writing applications in this way has a few benefits: for example, you don't need to re-request and parse the same stylesheets and javascript resources every time a new page loads. Another benefit is that the data-on-the-wire architecture that is usually used with single-page apps lessens the load on the server, since it makes clients responsible for template rendering.

In this article, we'll see how routing actually works under the hood.

### A little history

In the early days, emulating the act of navigating from one page to another in single-page apps used to be tricky: developers needed to remember to update the URL every time a new permalinkable state was required, and they needed to ensure their systems were back-button aware, so that clicking the back and forward buttons on the browser would not break. Arriving at any given URL via a bookmark also needed to restore the application state to the same place as if the user had navigated to that URL by clicking around.

Historically, the only way to get permalinkable, back-button-aware URLs that could be changed programmatically via javascript was to use `location.hash`. The hash, as the name implies, is what appears after the `#` symbol in a URL. It was originally designed for **named anchors**, a "bookmarking" feature that allowed users to quickly arrive at a desired section within a long document. Single page app routing frameworks hijacked this feature and made it isomorphic to the link-following scheme that we are all familiar with.

Single page app URLs then started to look similar to this:

```
http://foo.com/#/books/edit/1
```

HTML5 eventually brought another feature to javascript, called **push state**, to help make SPA URLs look more like traditional page URLs. It allows developers to write new browser history entries programmatically via javascript and rewrite the path of the current URL, so it became possible to route to URLs like this:

```
http://foo.com/books/edit/1
```

There is, however, one major caveat with this new API: it only rewrites the URL as the user sees it, but it cannot affect what a server returns if a user were to navigate to that URL using the browser address bar directly (thus bypassing the javascript code), or if the user were to arrive from an external site. So, in order to take full advantage of this API, extra server-side code to support state management is required.

### How it all comes together

Mithril supports three routing modes: `search`, `hash` and `pathname`. All of these take advantage of the `pushState` API for browsers that support it (which, nowadays include [most browsers except older versions of Internet Explorer](http://caniuse.com/#search=pushstate)), so whenever we change routes with Mithril, the framework simply calls `pushState` to rewrite the URL and add a new entry in the browser history.

Here's a trivial example.

```javascript
//use default mode
m.route.mode = "search"

m.route(document.body, "/page1", {
	"/page1": {
		controller: function() {}, 
		view: function() {
			return m("a[href='/page2']", {config: m.route}, "go to page 2")
		}
	},
	"/page2": {
		controller: function() {}, 
		view: function() {
			return m("a[href='/page1']", {config: m.route}, "go to page 1")
		}
	}
})
```

The code above defines two routes: `/page1` and `/page2`. If this code was running from `http://localhost`, Mithril would detect that `http://localhost` does not match any of the routes we defined, and would use `pushState` to change the URL to `http://localhost/?/page1`, which would then load the corresponding module.

Note that the new URL has a `?` in it. This is because we're using the default routing mode: `search` (as in `location.search`). If the routing mode was set to `hash` before calling `m.route`, the new URL would be `http://localhost/#/page1`. Finally, if the routing mode was `pathname`, the new URL would be `http://localhost/page1`

As I mentioned before, the URL change happens thanks to `pushState`, but it is possible to bypass this API by typing a URL directly in the browser's address bar, and it's also possible that a user is using a browser that does not support `pushState` altogether. What happens in those cases?

Well, if the routing mode is set to `hash`, then we fall back to the original behavior of `location.hash`, which happens to be the same as if we were using `pushState`. If the routing mode is set to `search`, then we fall back to simply reloading the page with a new querystring. This works by relying on the assumption that loading the same base URL (i.e. `http://localhost`) will return the same thing regardless of what the querystring looks like. This assumption is usually safe because, in the context of a single page app, this base URL usually points to a static file.

If the routing mode is set to `pathname`, then the caveats of rewritten URLs apply: both reloading the page from scratch and the fallback when `pushState` is not available will attempt to load the new URL (`http://localhost/page1`), which in most common server configurations will attempt to load a different resource than `http://localhost`. In this case, the developer must reconfigure the server to return the same resource for all relevant URLs.

Typically to reconfigure the server, a developer would make all paths return the same thing, unless they referred to resources within a special folder. This allows CSS, Javascript and images to load as expected, while allowing the application to be `pushState`-friendly. In PHP, one would use ModRewrite, in NodeJS, one would use a framework's routing system, and so on.

---

So if `hash` mode is the only one that never causes unexpected full-page reloads, and it doesn't rely on server configuration assumptions, why is Mithril's default routing mode `search` (i.e. querystring)?

If you recall, `hash` actually did serve a purpose before single page applications. If we hijack that feature in order to implement routing, it's no longer possible to use it to create named anchors. With that in mind, `search` mode is actually richer because it allows us do things like create back-to-top links and point to specific FAQs in long pages, and we don't need [hacky workarounds](https://docs.angularjs.org/api/ng/service/$anchorScroll) to be able to do these things. The non-`pushState` fallback is less efficient, but it's still functional and browsers without support for it are becoming less relevant as time goes on anyways.

Regardless, Mithril gives us another handy tool: giving a link an attribute `{config: m.route}` - as we did to the links in the example above - allows us to write mode-agnostic URLs in the `href` of the link. So the link `m("a[href='/page2']", {config: m.route}, "go to page 2")` goes to the correct route regardless of what routing mode we use. There's no need to search and replace `#` or `?` symbols all over the codebase if we decide to change from one routing mode to another.

Now that you know the pros and cons of each routing mode, all you need to do is change `m.route.mode` to what suits your needs.
