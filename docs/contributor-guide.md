# Contributor Guide

## Development Setup
```bash
# Clone and install dependencies
git clone https://github.com/yourorg/digital-double-mobile.git
cd digital-double-mobile
./scripts/setup-dev-env.sh  # Creates Python venv + npm install
```

## Code Standards
### Python (Backend)
```python
# Type hints required for public methods
def process_task(task: Task) -> TaskResult:
    """Single-line docstring"""
```

### Dart (Mobile)
```dart
// Null safety required
Future<AgentStatus> checkStatus() async {
  try {
    return await _client.getStatus();
  } on SocketException {
    return AgentStatus.offline;
  }
}
```

## Testing
```bash
# Run backend tests
pytest server/tests -v

# Mobile integration tests
flutter test integration_test/

# Web component tests
npm run test:components
```

## Contribution Process
1. Create feature branch from `dev`
```bash
git checkout -b feat/ar-enhancements
```
2. Commit with conventional messages
```bash
git commit -m "feat(ar): add gesture recognition support"
```
3. Open PR with:
- Architecture diagram updates
- API documentation changes
- Test coverage report

[Code of Conduct](/docs/CODE_OF_CONDUCT.md)