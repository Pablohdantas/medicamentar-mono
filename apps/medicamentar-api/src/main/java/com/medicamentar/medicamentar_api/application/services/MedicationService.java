package com.medicamentar.medicamentar_api.application.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.medicamentar.medicamentar_api.application.dtos.medicationDto.MedicationRequest;
import com.medicamentar.medicamentar_api.application.dtos.medicationDto.MedicationResponse;
import com.medicamentar.medicamentar_api.application.dtos.responsesDto.PaginatedResponse;
import com.medicamentar.medicamentar_api.application.dtos.responsesDto.ServiceResponse;
import com.medicamentar.medicamentar_api.domain.entities.Medication;
import com.medicamentar.medicamentar_api.domain.entities.User;
import com.medicamentar.medicamentar_api.domain.enums.EventLogAction;
import com.medicamentar.medicamentar_api.domain.enums.MedicationType;
import com.medicamentar.medicamentar_api.domain.repositories.MedicationRepository;
import com.medicamentar.medicamentar_api.infrastructure.security.TokenService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MedicationService {

    private final MedicationRepository medicationRepo;
    private final EventLogService eLogService;
    private final TokenService tokenService;

    public ServiceResponse<String> createMedication(MedicationRequest medicationRegister) {
        var response = new ServiceResponse<String>();
        User currentUser = tokenService.getCurrentUser();

        Medication medication = new Medication();
        medication.setName(medicationRegister.name());
        medication.setType(medicationRegister.type());
        medication.setDose(medicationRegister.dose());
        medication.setAmount(medicationRegister.amount());
        medication.setUnity(medicationRegister.unity());
        medication.setPeriod(medicationRegister.period());
        medication.setContinuousUse(medicationRegister.isContinuousUse());
        medication.setStart_date(medicationRegister.start_date());
        medication.setUser(currentUser);

        if (medicationRegister.type() == MedicationType.OFTALMICO && medicationRegister.ophthalmicDetails() != null) {
            medication.setOphthalmicDetails(medicationRegister.ophthalmicDetails());
        }

        this.medicationRepo.save(medication);
        this.eLogService.saveEvent(EventLogAction.Criado, medication);

        response.setMessage("Medicamento criado com sucesso!");
        response.setStatus(HttpStatus.CREATED);
        return response;
    }

    public PaginatedResponse<List<MedicationResponse>> getMedications(int page, int size) {
        PaginatedResponse<List<MedicationResponse>> response = new PaginatedResponse<>();
        User currentUser = tokenService.getCurrentUser();

        Pageable pageable = PageRequest.of(page, size);

        Page<Medication> medicationsPage = medicationRepo.findByUserAndDeletedAtIsNull(currentUser, pageable);

        List<MedicationResponse> medicationResponses = medicationsPage.getContent().stream()
                .map(medication -> new MedicationResponse(
                        medication.getId(),
                        medication.getName(),
                        medication.getType(),
                        medication.getDose(),
                        medication.getAmount(),
                        medication.getUnity(),
                        medication.getPeriod(),
                        medication.isContinuousUse(),
                        medication.getStart_date(),
                        medication.getEnd_date(),
                        medication.getType() == MedicationType.OFTALMICO ? medication.getOphthalmicDetails() : null))
                .collect(Collectors.toList());

        response.setData(medicationResponses);
        response.setStatus(HttpStatus.ACCEPTED);
        response.setMessage(String.format("Exibindo página %d de %d.", medicationsPage.getNumber() + 1, medicationsPage.getTotalPages()));
        response.setTotalPages(medicationsPage.getTotalPages());
        response.setTotalElements(medicationsPage.getTotalElements());
        return response;
    }

    public ServiceResponse<String> updateMedication(String id, MedicationRequest updateMedication) {
        var response = new ServiceResponse<String>();
        User currentUser = tokenService.getCurrentUser();

        UUID medicationId;
        try {
            medicationId = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            response.setMessage("ID inválido.");
            response.setStatus(HttpStatus.BAD_REQUEST);
            return response;
        }

        var medicationEntity = this.medicationRepo.findByIdAndUserAndDeletedAtIsNull(medicationId, currentUser);

        if (medicationEntity.isPresent()) {
            var medication = medicationEntity.get();
            
            if (!medication.getUser().getId().equals(currentUser.getId())) {
                response.setMessage("Você não tem permissão para editar este medicamento.");
                response.setStatus(HttpStatus.FORBIDDEN);
                return response;
            }

            medication.setName(updateMedication.name());
            medication.setType(updateMedication.type());
            medication.setDose(updateMedication.dose());
            medication.setUnity(updateMedication.unity());
            medication.setAmount(updateMedication.amount());
            medication.setPeriod(updateMedication.period());

            if (updateMedication.type() == MedicationType.OFTALMICO) {
                medication.setOphthalmicDetails(updateMedication.ophthalmicDetails());
            } else {
                medication.setOphthalmicDetails(null);
            }

            medicationRepo.save(medication);
            this.eLogService.saveEvent(EventLogAction.Atualizado, medication);

            response.setMessage("Atualizado com sucesso!");
            response.setStatus(HttpStatus.ACCEPTED);
        } else {
            response.setMessage("Medicamento não encontrado.");
            response.setStatus(HttpStatus.BAD_REQUEST);
        }
        return response;
    }

    public ServiceResponse<String> deleteMedication(String id) {
        var response = new ServiceResponse<String>();
        User currentUser = tokenService.getCurrentUser();

        UUID medicationId;
        try {
            medicationId = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            response.setMessage("ID inválido.");
            response.setStatus(HttpStatus.BAD_REQUEST);
            return response;
        }

        var medicationOpt = medicationRepo.findByIdAndUserAndDeletedAtIsNull(medicationId, currentUser);

        if (medicationOpt.isPresent()) {
            Medication medication = medicationOpt.get();

            if (!medication.getUser().getId().equals(currentUser.getId())) {
                response.setMessage("Você não tem permissão para deletar este medicamento.");
                response.setStatus(HttpStatus.FORBIDDEN);
                return response;
            }

            medication.setDeletedAt(LocalDateTime.now());
            medicationRepo.save(medication);
            eLogService.saveEvent(EventLogAction.Deletado, medication);

            response.setMessage("Medicamento deletado com sucesso!");
            response.setStatus(HttpStatus.ACCEPTED);
        } else {
            response.setMessage("Medicamento não encontrado.");
            response.setStatus(HttpStatus.NOT_FOUND);
        }

        return response;
    }
}
