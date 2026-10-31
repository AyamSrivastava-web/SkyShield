from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    loginMethod = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "name", "email", "loginMethod")

    def get_name(self, obj):
        if not getattr(obj, "is_authenticated", False):
            return ""
        full_name = obj.get_full_name() if hasattr(obj, "get_full_name") else ""
        return (full_name or getattr(obj, "first_name", "") or getattr(obj, "username", "")).strip()

    def get_loginMethod(self, obj):
        if not getattr(obj, "is_authenticated", False):
            return "email"
        try:
            return "google" if obj.groups.filter(name="Google Users").exists() else "email"
        except Exception:
            return "email"
