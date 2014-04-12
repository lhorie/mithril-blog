## Giving Mithril a voice

*April 11, 2014*

I released Mithril last month and the project has been getting generally positive feedback and some [good](https://github.com/jpmonette/todomvc-mithril) [traction](https://github.com/insin/msx).

There's still a lot of things I want to share with people that aren't necessarily core Mithril features, be them interesting application developement techniques, or my own experience w/ development and even open source in general, so today I'm launching this blog.

To give a recap of what's been happening since launch, Mithril is now a lot more accessible, being [available from CDNs, and popular NodeJS package managers](http://lhorie.github.io/mithril/installation.html).

In addition to this blog, the [mailing list](https://groups.google.com/forum/#!forum/mithriljs) and the [Github issue tracker](https://github.com/lhorie/mithril.js/issues?state=open) are great places to start conversations.

On the plumbing end, Mithril is now on Travis CI, and the test suite is rapidly growing. It now includes regression tests for reported bugs to ensure a stable core.

For the next little while, I'm hoping to nail down all the lingering bugs that contributors have been finding (particularly around the `m.render` method). Once I feel it's stable enough to bump Mithril to a v0.2, I'll have the chance to start putting more time on the plugin ecosystem, which has a really exciting pipeline: more readable and expressive templates, advanced optimization tools, a more wholesome approach to dependency management, etc - and hopefully no changes to the core codebase in order to support all of this :)

If you're liking Mithril, you can help in a few different ways. The easiest is to spread the word. Another way is to try it out and report any bugs you find. You're also welcome to post topics in the mailing list or get in touch with me directly.

If you want a project to take on, there's a lot of stuff that can be done in terms of plugins, and if you need help getting started, I'm more than happy to help get the ball moving for you. [This thread](https://github.com/lhorie/mithril.js/issues/38), for example is a good starting point.

In the coming weeks, I'm hoping to start writing more topics about actual development, both in general, and as it relates to Mithril, so stay tuned :)

