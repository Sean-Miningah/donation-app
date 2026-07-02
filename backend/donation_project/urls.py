"""
URL configuration for donation_project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from donations.views import DonationViewSet

router = DefaultRouter()
router.register(r"donations", DonationViewSet, basename="donation")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    # OpenAPI schema + Swagger UI + Redoc
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]