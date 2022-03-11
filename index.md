---
layout: home
title: Benjamin Chait
---
<img src="/assets/img/IMG_0534.jpeg" style="float: left; width: 9rem; border-radius: 50%; margin: 0 1em 1em 0;" />

<p>I’m a product manager and a writer with an interest using technology to help people create better habits, with a particular focus on financial wellness. I help build and scale tech organizations, and recently moved to Chicago with my best friend Lyra.</p>

<p>Currently, I’m consulting and am open to new work. My superpower is helping small teams build the habits and rituals which lead to sustainable, impactful product development. You can learn more <a href="/about">about me</a> and I’d be delighted to chat!</p>

<div style="clear: both;">&nbsp;</div>

<script src='https://api.mapbox.com/mapbox-gl-js/v2.7.0/mapbox-gl.js'></script>
<link href='https://api.mapbox.com/mapbox-gl-js/v2.7.0/mapbox-gl.css' rel='stylesheet' />
<div id="map_outdoors" style="width: 600px; height: 300px; margin: 20px;"></div>
<script>
mapboxgl.accessToken = 'pk.eyJ1IjoiYmVuamFtaW5jaGFpdCIsImEiOiJjbDBsbzMyd2UwM3Z0M2NxMXM5cWNwNjZ6In0.QJ4_7OYM5QpBM_faDTmD8A';
const map_outdoors = new mapboxgl.Map({
  container: 'map_outdoors', // container ID
  style: 'mapbox://styles/mapbox/outdoors-v11', // style URL
  center: [-87.596532, 41.795068], // starting position [lng, lat]
  zoom: 13 // starting zoom
});
</script>

<!-- indie auth https://indieweb.org/rel-me and https://indielogin.com/setup -->
<link href="https://twitter.com/benjaminchait" rel="me">
<link href="https://github.com/benjaminchait" rel="me">
<!-- end indie auth -->