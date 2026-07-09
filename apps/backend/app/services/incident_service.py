from fastapi import Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from app.infrastructure.database import db
from app.infrastructure.repositories import IncidentRepository, AnomalyRepository
from app.infrastructure.models import IncidentTicketModel
from app.domain.incident import IncidentTicket, IncidentPriority, IncidentStatus
from app.domain.anomaly import Anomaly, AnomalySeverity
from app.core.exceptions import NotFoundException, ValidationException


class IncidentService:
    """Service to manage ITIL incident tickets and SLA compliance"""

    def __init__(self, db_session: Session = Depends(db.get_db)):
        from fastapi.params import Depends as DependsClass
        if isinstance(db_session, DependsClass) or db_session is None:
            self.db = db.SessionLocal()
        else:
            self.db = db_session
        self.incident_repo = IncidentRepository(self.db)
        self.anomaly_repo = AnomalyRepository(self.db)

    def create_incident(self, anomaly: Anomaly) -> IncidentTicket:
        """Create a new incident ticket from a detected anomaly"""
        # Generate code: INC-YYYYMMDD-XXX
        today_str = datetime.utcnow().strftime("%Y%m%d")
        existing_today = self.incident_repo.get_all(dma_id=anomaly.dma_id)
        sequence = len(existing_today) + 1
        code = f"INC-{today_str}-{sequence:03d}"

        # Determine priority from anomaly severity
        priority_map = {
            AnomalySeverity.CRITICAL: IncidentPriority.CRITICAL,
            AnomalySeverity.HIGH: IncidentPriority.HIGH,
            AnomalySeverity.MEDIUM: IncidentPriority.MEDIUM,
            AnomalySeverity.LOW: IncidentPriority.LOW
        }
        priority = priority_map.get(anomaly.severity, IncidentPriority.MEDIUM)

        # SLA calculation
        sla_hours = {
            IncidentPriority.CRITICAL: 2,
            IncidentPriority.HIGH: 4,
            IncidentPriority.MEDIUM: 8,
            IncidentPriority.LOW: 24
        }
        sla_duration = sla_hours.get(priority, 8)
        sla_due_at = datetime.utcnow() + timedelta(hours=sla_duration)

        ticket_model = IncidentTicketModel(
            code=code,
            anomaly_id=anomaly.id,
            dma_id=anomaly.dma_id,
            dma_name=anomaly.dma_name,
            title=f"Incidencia Hidráulica en {anomaly.dma_name}",
            description=anomaly.description or "Detección de anomalías en lecturas de presión y caudal",
            priority=priority.value,
            status=IncidentStatus.NEW.value,
            sla_due_at=sla_due_at
        )

        saved = self.incident_repo.create(ticket_model)
        return self._to_domain(saved)

    def get_all_tickets(
        self,
        status: Optional[IncidentStatus] = None,
        dma_id: Optional[str] = None,
        priority: Optional[IncidentPriority] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[IncidentTicket]:
        """Get tickets with filters"""
        status_val = status.value if status else None
        priority_val = priority.value if priority else None
        
        tickets = self.incident_repo.get_all(status_val, dma_id, priority_val, limit, offset)
        return [self._to_domain(t) for t in tickets]

    def get_ticket(self, ticket_id: int) -> Optional[IncidentTicket]:
        """Get ticket by ID"""
        ticket = self.incident_repo.get_by_id(ticket_id)
        if not ticket:
            return None
        return self._to_domain(ticket)

    def get_ticket_by_code(self, code: str) -> Optional[IncidentTicket]:
        """Get ticket by Code"""
        ticket = self.incident_repo.get_by_code(code)
        if not ticket:
            return None
        return self._to_domain(ticket)

    def update_ticket_status(self, ticket_id: int, status: IncidentStatus, notes: Optional[str] = None) -> IncidentTicket:
        """Update incident status validating ITIL state transition rules"""
        ticket = self.incident_repo.get_by_id(ticket_id)
        if not ticket:
            raise NotFoundException("Ticket", str(ticket_id))

        current_status = IncidentStatus(ticket.status)
        
        # ITIL transitions validation
        valid_transitions = {
            IncidentStatus.NEW: [IncidentStatus.CLASSIFIED, IncidentStatus.REJECTED],
            IncidentStatus.CLASSIFIED: [IncidentStatus.ASSIGNED, IncidentStatus.REJECTED],
            IncidentStatus.ASSIGNED: [IncidentStatus.IN_PROGRESS, IncidentStatus.CANCELLED],
            IncidentStatus.IN_PROGRESS: [IncidentStatus.RESOLVED, IncidentStatus.CANCELLED],
            IncidentStatus.RESOLVED: [IncidentStatus.CLOSED, IncidentStatus.REOPENED],
            IncidentStatus.CLOSED: [IncidentStatus.REOPENED],
            IncidentStatus.REOPENED: [IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED],
            IncidentStatus.REJECTED: [IncidentStatus.CLOSED],
            IncidentStatus.CANCELLED: [IncidentStatus.CLOSED],
        }

        if status not in valid_transitions.get(current_status, []):
            raise ValidationException(f"Transición de estado inválida de {current_status.value} a {status.value}")

        ticket.status = status.value
        ticket.updated_at = datetime.utcnow()

        if status == IncidentStatus.RESOLVED:
            ticket.resolved_at = datetime.utcnow()
            diff = ticket.resolved_at - ticket.created_at
            ticket.resolution_time_minutes = int(diff.total_seconds() / 60)
            
            # Update associated anomaly
            anomaly = self.anomaly_repo.get_by_id(ticket.anomaly_id)
            if anomaly:
                anomaly.status = "RESOLVED"
                anomaly.resolved_at = datetime.utcnow()
                self.anomaly_repo.update(anomaly)
                
        elif status == IncidentStatus.CLOSED:
            ticket.closed_at = datetime.utcnow()
            
        elif status == IncidentStatus.ASSIGNED:
            # Assingment response time calculation
            diff = datetime.utcnow() - ticket.created_at
            ticket.response_time_minutes = int(diff.total_seconds() / 60)

        updated = self.incident_repo.update(ticket)
        return self._to_domain(updated)

    def assign_ticket(self, ticket_id: int, assigned_to: str) -> IncidentTicket:
        """Assign incident ticket to operator"""
        ticket = self.incident_repo.get_by_id(ticket_id)
        if not ticket:
            raise NotFoundException("Ticket", str(ticket_id))

        ticket.status = IncidentStatus.ASSIGNED.value
        ticket.assigned_to = assigned_to
        ticket.updated_at = datetime.utcnow()
        
        diff = datetime.utcnow() - ticket.created_at
        ticket.response_time_minutes = int(diff.total_seconds() / 60)

        updated = self.incident_repo.update(ticket)
        return self._to_domain(updated)

    def get_sla_metrics(self) -> Dict[str, Any]:
        """Calculate SLA compliance metrics"""
        tickets = self.incident_repo.get_all(limit=1000)
        total = len(tickets)
        if total == 0:
            return {
                "total_tickets": 0,
                "sla_compliance_rate": 100.0,
                "breached_tickets": 0,
                "critical_tickets": 0,
                "open_tickets": 0
            }

        breached = 0
        critical = 0
        open_count = 0
        now = datetime.utcnow()

        for t in tickets:
            is_open = t.status not in [IncidentStatus.CLOSED.value, IncidentStatus.RESOLVED.value, IncidentStatus.REJECTED.value, IncidentStatus.CANCELLED.value]
            if is_open:
                open_count += 1
                if now > t.sla_due_at:
                    breached += 1
            else:
                resolution_time = t.resolved_at or t.closed_at
                if resolution_time and resolution_time > t.sla_due_at:
                    breached += 1
                    
            if t.priority == IncidentPriority.CRITICAL.value:
                critical += 1

        compliance_rate = ((total - breached) / total) * 100.0

        return {
            "total_tickets": total,
            "sla_compliance_rate": round(compliance_rate, 2),
            "breached_tickets": breached,
            "critical_tickets": critical,
            "open_tickets": open_count
        }

    def _to_domain(self, model: IncidentTicketModel) -> IncidentTicket:
        return IncidentTicket(
            id=model.id,
            code=model.code,
            anomaly_id=model.anomaly_id,
            dma_id=model.dma_id,
            dma_name=model.dma_name,
            title=model.title,
            description=model.description,
            priority=IncidentPriority(model.priority),
            status=IncidentStatus(model.status),
            assigned_to=model.assigned_to,
            created_at=model.created_at,
            updated_at=model.updated_at,
            sla_due_at=model.sla_due_at,
            resolved_at=model.resolved_at,
            closed_at=model.closed_at,
            response_time_minutes=model.response_time_minutes,
            resolution_time_minutes=model.resolution_time_minutes
        )
