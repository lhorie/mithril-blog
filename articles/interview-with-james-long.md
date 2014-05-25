## Interview with James Long

This week I'm trying something different. I've been in touch with [Hrishi Mittal](https://twitter.com/getgini), a marketing guy, and he suggested doing interviews with people doing awesome things (particularly with frontend technologies). So we thought a follow-up on the [article about reducing UI complexity](http://lhorie.github.io/mithril-blog/an-exercise-in-awesomeness.html) would be interesting.

Anyways, without further ado.

James Long is a web developer at Mozilla in the Firefox Developer Tools team. His projects include a fork of LLJS that compiles to asm.js, things built on nunjucks (a templating engine for Javascript) and even an iOS game involving farm animals (https://github.com/jlongster ). He blogs at [http://jlongster.com](http://jlongster.com) and tweets at [https://twitter.com/jlongster](https://twitter.com/jlongster).

In this interview, I talk to James about his work at Mozilla, his personal projects and recent experimentation with MVC frameworks.

**Tell me about yourself and your work at Mozilla**
 
I'm 29 years old and I work remotely from Virginia for Mozilla. I like
to keep track of what's being researched in the academic world (and
also communities like Clojure) and help bring those ideas to
JavaScript. My day job for Mozilla is working on the Firefox Developer
Tools, particularly the debugger. I'm somewhat new to the team and I
love helping developers debug their code.
 
**Could you please tell me about the motivation of the "Removing User Interface Complexity" article?**
 
I've been eagerly watching what's happening with UIs on the web world
for a while. Web Components has always been confusing to me because
the practical examples everybody shows don't actually deliver what
they promise. Last week I tried to use a Web Component with Ember, but
there's no way to bind an element's event to your controller method in
a template. This is Web Components fault; they don't provide the right
API to make this work yet. Google calls Polymer a library, but to me
it feels like an awkward framework, and it doesn't show off the actual
interesting parts of Web Components: hooking them into different
existing frameworks.
 
Meanwhile, Facebook released React. I didn't understand it at first,
but after reading David Nolen's blog post [1] I instantly got it.
After using it for a while, I really fell in love with it. It truly is
a library, letting you use any data structure you want, and it only
cares about rendering and separating out your UI into components.
 
My blog post initially was a rant about Web Components and how
confusing the messaging (particularly Google's) is. It didn't feel
productive though, so I decided to focus on React and explain what I
thought was the right way to do UIs in modern apps, and compare it to
Web Components here and there. I wanted to push Web Components to
focus on low-level plumbing for sharing components, not a framework.
 
**You do some pretty cool interactive stuff in that article. Did you start out thinking you'd do all that or did you get the idea while writing it? How long did it take you to write it?**
 
When I decided to focus on React, I definitely wanted to do something
cool and interactive. I knew it needed that to fully demonstrate the
concepts. Writing demos also forced me to stay grounded and not go too
abstract. I've had the idea for that specific layout before when
writing other posts, but this is the first time trying it. It took
about 3 weeks off and on to write the whole post, including the
interactive layout.
 
**How important do you think client-side MVC frameworks are for mobile?**
 
They might even be more important for mobile than desktop. Content in
mobile often takes the shape of an "app", which has very clear needs
for something like MVC that handles separate views, how they interact,
and binding data to the UI. The really good modern libraries &
frameworks also help keep your app performant by reducing DOM changes.
 
**You've built iOS games too, one of them called Farmageddon which you recently open sourced. How does programming for iOS compare to web programming, personally for you?**
 
My iOS experience is dated by about 4 years, so a lot has probably
changed. In general, iOS provides a really good, solid set of
libraries for making powerful apps, and the web is still catching up
with these APIs. However, I'd take making UIs on the web over iOS any
day, where you have to manually manage lots of UIViews and things like
that. Although HTML/CSS/JS has its quirks, it really is flexible for
creating UIs.
 
**What developer tools do you use that you couldn't live without?**
 
Honestly, I don't know what I'd do without git and ssh. ssh is my
network plumbing, and git is my time traveling device. I know that's
low-level, but it's the first thing that came to mind. Otherwise,
Emacs is required for writing code and, of course, Firefox Developer
Tools for debugging it.
 
**Can you name some programmers who inspire you?**
 
I'm an old Lisp/Schemer, so many of them come from that world. Many of
the clojurists inspire me: Rich Hickey, David Nolen, and others.
Brendan Eich, Dave Herman, Andy Wingo. All of them have had some
involvement with Scheme. I guess you could say I'm inspired by the
whole Lisp/Scheme world, haha.
 
[1] http://swannodette.github.io/2013/12/17/the-future-of-javascript-mvcs/