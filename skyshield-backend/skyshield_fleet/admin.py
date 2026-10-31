from django.contrib import admin
from .models import Aircraft, Incident, ComplianceItem


@admin.register(Aircraft)
class AircraftAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "aircraft_type",
        "fleet",
        "reports",
        "trend",
        "trend_tone",
        "status",
        "color",
        "registration_number",
        "created_at",
    )
    list_filter = ("status", "trend_tone", "aircraft_type")
    search_fields = ("code", "name", "registration_number", "operator")


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = (
        "incident_id",
        "title",
        "aircraft",
        "location",
        "severity",
        "status",
        "progress",
        "category",
        "created_at",
    )
    list_filter = ("severity", "status", "category")
    search_fields = ("incident_id", "title", "aircraft", "location", "reporter")


@admin.register(ComplianceItem)
class ComplianceItemAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "owner", "due", "progress", "status", "created_at")
    list_filter = ("status", "owner")
    search_fields = ("name", "code", "owner")
