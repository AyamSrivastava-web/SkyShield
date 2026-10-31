import random
from rest_framework import serializers
from .models import Aircraft, Incident, ComplianceItem


class AircraftSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="aircraft_type", required=False)
    trendTone = serializers.CharField(source="trend_tone", required=False)

    class Meta:
        model = Aircraft
        fields = [
            "id",
            "code",
            "name",
            "type",
            "aircraft_type",
            "fleet",
            "reports",
            "trend",
            "trendTone",
            "trend_tone",
            "status",
            "color",
            "registration_number",
            "manufacturer",
            "model",
            "operator",
            "created_at",
            "updated_at",
        ]


class IncidentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="incident_id", required=False)
    incident_id = serializers.CharField(required=False)

    class Meta:
        model = Incident
        fields = [
            "id",
            "incident_id",
            "aircraft",
            "title",
            "location",
            "time",
            "severity",
            "status",
            "progress",
            "category",
            "reporter",
            "occurrence_date",
            "flight",
            "narrative",
            "factors",
            "primary_factor",
            "primary_factor_desc",
            "system_factor",
            "system_factor_desc",
            "action_title",
            "action_desc",
            "action_owner",
            "action_due",
            "action_progress",
            "created_at",
            "updated_at",
        ]

    def to_internal_value(self, data):
        ret = data.copy() if hasattr(data, "copy") else dict(data)
        if "id" in ret and "incident_id" not in ret:
            ret["incident_id"] = ret["id"]
        if "date" in ret and "occurrence_date" not in ret:
            ret["occurrence_date"] = ret["date"]
        return super().to_internal_value(ret)

    def create(self, validated_data):
        incident_id = validated_data.get("incident_id")
        if not incident_id:
            raw_id = self.initial_data.get("id") or self.initial_data.get("incident_id")
            if raw_id:
                validated_data["incident_id"] = str(raw_id)
            else:
                validated_data["incident_id"] = f"INC-{random.randint(4100, 4999)}"

        instance = super().create(validated_data)

        # Increment aircraft report count
        plane = Aircraft.objects.filter(code__iexact=instance.aircraft[:4]).first()
        if not plane:
            plane = Aircraft.objects.filter(name__icontains=instance.aircraft).first()
        if plane:
            plane.reports += 1
            plane.save(update_fields=["reports"])

        return instance


class ComplianceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplianceItem
        fields = [
            "id",
            "name",
            "code",
            "owner",
            "due",
            "progress",
            "status",
            "created_at",
        ]
