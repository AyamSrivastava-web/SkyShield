from django.urls import path
from .views import (
    AircraftDetailView,
    AircraftListCreateView,
    ComplianceItemDetailView,
    ComplianceItemListView,
    DashboardStatsView,
    IncidentDetailView,
    IncidentListCreateView,
)

urlpatterns = [
    path("aircraft/", AircraftListCreateView.as_view(), name="aircraft-list-create"),
    path("aircraft/<str:code>/", AircraftDetailView.as_view(), name="aircraft-detail"),
    path("incidents/", IncidentListCreateView.as_view(), name="incident-list-create"),
    path("incidents/<str:incident_id>/", IncidentDetailView.as_view(), name="incident-detail"),
    path("compliance/", ComplianceItemListView.as_view(), name="compliance-list"),
    path("compliance/<int:id>/", ComplianceItemDetailView.as_view(), name="compliance-detail"),
    path("stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]