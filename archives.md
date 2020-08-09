---
layout: default
pagination:
  enabled: true
title: Archive
permalink: /archives/
---
<ul class="posts">
  {% for post in site.posts %}
    <li>
      <a href="{% if post.external %}{{ post.external }}{% else %}{{ post.url }}{% endif %}">
        <div>
          <span class="title">{{ post.title }}</span>
        </div>
      </a> <span class="date">{{ post.date | date: "%B %-d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>