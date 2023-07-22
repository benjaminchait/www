---
layout: page
title: Archives
permalink: /archives
published: true
---
<div class="markdownfix">
{% for post in site.posts %}
  {% assign currentdate = post.date | date: "%Y" %}
  {% if currentdate != date %}
    {% unless forloop.first %}</ul>{% endunless %}
    <h2 id="y{{post.date | date: "%Y"}}">{{ currentdate }}</h2>
    <ul class="posts">
    {% assign date = currentdate %}
  {% endif %}
    <li>
      <a href="{% if post.external %}{{ post.external }}{% else %}{{ post.url }}{% endif %}"><span class="title">{{ post.title }}</span></a> <span class="date">{{ post.date | date: "%-d %B %Y" }}</span>
    </li>
  {% if forloop.last %}</ul>{% endif %}
{% endfor %}
</div>
