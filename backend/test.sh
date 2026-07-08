#!/bin/bash
mvn test -Dtest="ReservationIntegrationTest#concurrentReservation_RaceCondition_OnlyOneSucceeds" -Dsurefire.printSummary=true 2>&1 | grep "FAILED WITH STATUS" || true
