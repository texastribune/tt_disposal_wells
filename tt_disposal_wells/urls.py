from django.conf.urls import patterns, url

from . import views


urlpatterns = patterns('',
    url(r'^/?$', views.LandingPageView.as_view(), name='landing'),
)
