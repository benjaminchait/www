---
layout: page
title: Archives
permalink: /archives
published: true
---
{% for post in site.posts %}
- [{{ post.title }}]({{ post.url }}) {{ post.date | date: "%-d %B %Y" }}
{% endfor %}
