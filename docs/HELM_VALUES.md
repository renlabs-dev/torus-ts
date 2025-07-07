# Helm Values Configuration Patterns

## Environment Variable Patterns

### ConfigMaps (Public Config)

```yaml
env:
  NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS:
    valueFrom:
      configMapKeyRef:
        name: '{{ template "application.name" . }}-config'
        key: torus_allocator_address
```

### Secrets (Sensitive Data)

```yaml
env:
  JWT_SECRET:
    valueFrom:
      secretKeyRef:
        name: "torus-{{ .Values.environmentName }}-web-apps-secret"
        key: jwt_secret
```

## Conventions

- **ConfigMap name**: `{{ template "application.name" . }}-config`
- **Secret name**: `torus-{{ .Values.environmentName }}-web-apps-secret`
- **Client-side vars**: Use `NEXT_PUBLIC_` prefix
- **Shared keys**: `torus_allocator_address` used across multiple apps
