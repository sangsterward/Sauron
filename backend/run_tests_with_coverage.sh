#!/bin/bash

# Run tests with coverage reporting
echo "🧪 Running tests with coverage..."
poetry run coverage run --source='.' manage.py test

echo "📊 Generating coverage reports..."
poetry run coverage report
poetry run coverage html
poetry run coverage xml

echo "✅ Coverage reports generated:"
echo "   - Terminal report: coverage report"
echo "   - HTML report: htmlcov/index.html"
echo "   - XML report: coverage.xml"

echo ""
echo "📈 Overall Coverage: $(poetry run coverage report | tail -1 | awk '{print $NF}')"
