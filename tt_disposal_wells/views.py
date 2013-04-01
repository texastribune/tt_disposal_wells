from django.views.generic import TemplateView


class LandingPageView(TemplateView):
    template_name = 'tt_disposal_wells/landing.html'
