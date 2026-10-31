import random
from django.db import models


class Aircraft(models.Model):
    TREND_TONE_CHOICES = [
        ("good", "Good"),
        ("warn", "Warn"),
    ]

    code = models.CharField(max_length=20, unique=True, help_text="e.g. A320, B737, E190, B787")
    name = models.CharField(max_length=100, help_text="e.g. Airbus A320-200")
    aircraft_type = models.CharField(max_length=100, default="Narrow-body", help_text="e.g. Narrow-body, Long-haul")
    fleet = models.CharField(max_length=50, default="12 active", help_text="e.g. 24 active")
    reports = models.IntegerField(default=0)
    trend = models.CharField(max_length=20, default="0%", help_text="e.g. -18%, +6%")
    trend_tone = models.CharField(max_length=10, choices=TREND_TONE_CHOICES, default="good")
    status = models.CharField(max_length=50, default="Nominal")
    color = models.CharField(max_length=30, default="#7dd3fc")

    # Fleet registry details
    registration_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    manufacturer = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    operator = models.CharField(max_length=150, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]
        verbose_name = "Aircraft"
        verbose_name_plural = "Aircraft"

    def __str__(self):
        return f"{self.code} - {self.name}"


class Incident(models.Model):
    SEVERITY_CHOICES = [
        ("Low", "Low"),
        ("Medium", "Medium"),
        ("High", "High"),
        ("Critical", "Critical"),
    ]

    STATUS_CHOICES = [
        ("Awaiting review", "Awaiting review"),
        ("Investigating", "Investigating"),
        ("In progress", "In progress"),
        ("Review complete", "Review complete"),
        ("Corrective action", "Corrective action"),
        ("Closed", "Closed"),
    ]

    incident_id = models.CharField(max_length=30, unique=True, blank=True, help_text="e.g. INC-4821")
    aircraft = models.CharField(max_length=100, help_text="e.g. B737-800 or A320-200")
    title = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    time = models.CharField(max_length=100, blank=True, default="Just now")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="Medium")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Awaiting review")
    progress = models.IntegerField(default=8)
    category = models.CharField(max_length=100, default="General")

    # Detailed report attributes
    reporter = models.CharField(max_length=150, blank=True)
    occurrence_date = models.CharField(max_length=50, blank=True)
    flight = models.CharField(max_length=100, blank=True)
    narrative = models.TextField(blank=True)
    factors = models.TextField(blank=True)

    # Root-cause analysis & action plan
    primary_factor = models.CharField(max_length=255, blank=True, default="Maintenance handover gap")
    primary_factor_desc = models.TextField(
        blank=True, default="Last service note lacked a pressure trend annotation."
    )
    system_factor = models.CharField(max_length=255, blank=True, default="Procedure variance")
    system_factor_desc = models.TextField(
        blank=True, default="Checklist step 4B was interpreted differently across shifts."
    )
    action_title = models.CharField(max_length=255, blank=True, default="Standardize pressure handover note")
    action_desc = models.TextField(
        blank=True, default="Update maintenance shift brief template and brief all line supervisors."
    )
    action_owner = models.CharField(max_length=150, blank=True, default="Vikram S.")
    action_due = models.CharField(max_length=100, blank=True, default="04 Oct")
    action_progress = models.IntegerField(default=42)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Safety Incident"
        verbose_name_plural = "Safety Incidents"

    def save(self, *args, **kwargs):
        if not self.incident_id:
            for _ in range(100):
                gen_id = f"INC-{random.randint(4100, 4999)}"
                if not Incident.objects.filter(incident_id=gen_id).exists():
                    self.incident_id = gen_id
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.incident_id}: {self.title} ({self.aircraft})"


class ComplianceItem(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, help_text="e.g. ICAO ANNEX 18")
    owner = models.CharField(max_length=150)
    due = models.CharField(max_length=100)
    progress = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default="On track")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "Compliance Item"
        verbose_name_plural = "Compliance Items"

    def __str__(self):
        return f"{self.name} ({self.code})"