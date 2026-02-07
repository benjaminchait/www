---
layout: page
title: Archives
permalink: /archives
published: true
---
<ul class="posts">
  {% for post in collections.postsByDate %}
    <li>
      <a href="{% if post.data.external %}{{ post.data.external }}{% else %}{{ post.url | url }}{% endif %}"><span class="title">{{ post.data.title }}</span></a> <span class="date">{{ post.date | date: "%-d %B %Y" }}</span>
    </li>
  {% endfor %}
</ul>
