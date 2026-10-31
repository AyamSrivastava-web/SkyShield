from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Aircraft, ComplianceItem, Incident
from .serializers import AircraftSerializer, ComplianceItemSerializer, IncidentSerializer


class AircraftListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Aircraft.objects.all()
    serializer_class = AircraftSerializer


class AircraftDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Aircraft.objects.all()
    serializer_class = AircraftSerializer
    lookup_field = "code"

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_field, "").strip()
        obj = Aircraft.objects.filter(code__iexact=lookup).first()
        if not obj and lookup.isdigit():
            obj = Aircraft.objects.filter(id=int(lookup)).first()
        if not obj:
            raise NotFound(detail=f"Aircraft '{lookup}' not found.")
        self.check_object_permissions(self.request, obj)
        return obj


class IncidentListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class IncidentDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer
    lookup_field = "incident_id"

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_field, "").strip()
        obj = Incident.objects.filter(incident_id__iexact=lookup).first()
        if not obj and lookup.isdigit():
            obj = Incident.objects.filter(id=int(lookup)).first()
        if not obj:
            raise NotFound(detail=f"Incident '{lookup}' not found.")
        self.check_object_permissions(self.request, obj)
        return obj


class ComplianceItemListView(ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = ComplianceItem.objects.all()
    serializer_class = ComplianceItemSerializer


class ComplianceItemDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = ComplianceItem.objects.all()
    serializer_class = ComplianceItemSerializer
    lookup_field = "id"


class DashboardStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        total_aircraft = Aircraft.objects.count()
        total_incidents = Incident.objects.count()
        open_incidents = Incident.objects.exclude(status="Closed").count()
        closed_incidents = Incident.objects.filter(status="Closed").count()

        safety_index = 98.7
        if total_aircraft > 0:
            safety_index = max(70.0, min(99.9, round(100.0 - (open_incidents * 1.3), 1)))

        return Response({
            "safety_index": safety_index,
            "open_incidents": open_incidents,
            "total_incidents": total_incidents,
            "closed_incidents": closed_incidents,
            "total_aircraft": total_aircraft,
            "reporting_rate": 76,
            "investigation_confidence": 82,
        })