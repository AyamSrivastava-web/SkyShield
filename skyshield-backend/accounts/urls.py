from django.urls import path
from .views import GoogleLoginView, LoginView, LogoutView, MeView, SignupView

urlpatterns = [
    path("signup/", SignupView.as_view(), name="auth-signup"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("google/", GoogleLoginView.as_view(), name="auth-google"),
    path("me/", MeView.as_view(), name="auth-me"),
]
