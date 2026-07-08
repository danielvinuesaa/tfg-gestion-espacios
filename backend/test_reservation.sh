#!/bin/bash
mvn test -Dtest="ReservationIntegrationTest" -DfailIfNoTests=false | grep -C 5 "FAILURE"
