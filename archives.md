---
layout: default
pagination:
  enabled: true
title: Archives
permalink: /archives/
---
<ul class="posts">
  {% for post in site.posts %}
    <li>
      <a href="{% if post.external %}{{ post.external }}{% else %}{{ post.url }}{% endif %}">
        <span class="title">{{ post.title }}</span>
      </a> <span class="date">{{ post.date | date: "%-d %B %Y" }}</span>
    </li>
  {% endfor %}
</ul>
