---
layout: page
title: Archives
permalink: /archives
published: true
---
<ul class="posts">
  {% set allPosts = collections.posts | reverse %}
  {% for post in allPosts %}
    <li>
      <a href="{% if post.data.external %}{{ post.data.external }}{% else %}{{ post.url }}{% endif %}"><span class="title">{{ post.data.title }}</span></a> <span class="date">{{ post.date | readableDate }}</span>
    </li>
  {% endfor %}
</ul>
