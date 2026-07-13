package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.AdminEmployeeDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.model.Employee;
import com.example.hy_backend.repository.EmployeeRepository;
import com.example.hy_backend.service.AdminEmployeeService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AdminEmployeeServiceImpl implements AdminEmployeeService {

    private static final String DEFAULT_PASSWORD = "password123";
    private static final String[] TEMPLATE_HEADERS = {
        "employee_id", "full_name", "email", "department",
        "role_code", "work_mode", "office_location", "password"
    };
    private static final String[] TEMPLATE_NOTES = {
        "e.g. EMP100 (unique)", "Full display name", "Work email",
        "e.g. Engineering", "EMPLOYEE / HR / MANAGER / FINANCE / CLOUD / RD / DIRECTOR / IS / NOC / OPS / DEVOPS",
        "HYBRID / ON_SITE / REMOTE", "HYDERABAD / KOLKATA / MUMBAI", "Leave blank = password123"
    };

    private final EmployeeRepository employeeRepository;

    public AdminEmployeeServiceImpl(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Override
    public List<AdminEmployeeDtos.EmployeeResponse> listEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public AdminEmployeeDtos.EmployeeResponse createEmployee(AdminEmployeeDtos.EmployeeCreateRequest req) {
        String id = normalizeId(req.employeeId());
        if (id.isBlank()) throw new BadRequestException("employee_id is required");
        if (employeeRepository.existsById(id))
            throw new BadRequestException("Employee ID already exists: " + id);

        String email = req.email() == null ? "" : req.email().trim().toLowerCase(Locale.ROOT);
        if (email.isBlank()) throw new BadRequestException("email is required");
        if (employeeRepository.existsByEmailIgnoreCase(email))
            throw new BadRequestException("Email already exists: " + email);

        Employee e = new Employee();
        e.setEmployeeId(id);
        e.setFullName(req.fullName() == null ? id : req.fullName().trim());
        e.setEmail(email);
        e.setDepartment(req.department());
        e.setRoleCode(normalizeRole(req.roleCode()));
        e.setWorkMode(normalizeWorkMode(req.workMode()));
        e.setOfficeLocation(normalizeLocation(req.officeLocation()));
        e.setActive(true);

        String rawPw = req.password() == null || req.password().isBlank() ? DEFAULT_PASSWORD : req.password().trim();
        e.setPasswordHash(hashPassword(rawPw));

        return toResponse(employeeRepository.save(e));
    }

    @Override
    public AdminEmployeeDtos.BulkUploadResult bulkCreate(MultipartFile file) throws IOException {
        List<AdminEmployeeDtos.EmployeeCreateRequest> rows = parseExcel(file);
        int created = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {
            AdminEmployeeDtos.EmployeeCreateRequest req = rows.get(i);
            int rowNum = i + 3; // data starts at row 3 (1-indexed: row1=header, row2=notes)
            try {
                createEmployee(req);
                created++;
            } catch (BadRequestException ex) {
                skipped++;
                errors.add("Row " + rowNum + ": " + ex.getMessage());
            }
        }
        return new AdminEmployeeDtos.BulkUploadResult(created, skipped, errors);
    }

    @Override
    public List<java.util.Map<String, String>> previewRows(MultipartFile file) throws IOException {
        List<AdminEmployeeDtos.EmployeeCreateRequest> rows = parseExcel(file);
        return rows.stream().map(r -> {
            java.util.Map<String, String> m = new java.util.LinkedHashMap<>();
            m.put("employee_id",    r.employeeId()    == null ? "" : r.employeeId());
            m.put("full_name",      r.fullName()      == null ? "" : r.fullName());
            m.put("email",          r.email()         == null ? "" : r.email());
            m.put("department",     r.department()    == null ? "" : r.department());
            m.put("role_code",      r.roleCode()      == null ? "" : r.roleCode());
            m.put("work_mode",      r.workMode()      == null ? "" : r.workMode());
            m.put("office_location",r.officeLocation()== null ? "" : r.officeLocation());
            m.put("password",       "");
            return m;
        }).toList();
    }

    @Override
    public byte[] generateTemplate() throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("Employees");
            sheet.setDefaultColumnWidth(22);

            // Header style
            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.INDIGO.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = wb.createFont();
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            // Notes style
            CellStyle noteStyle = wb.createCellStyle();
            noteStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            noteStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font noteFont = wb.createFont();
            noteFont.setItalic(true);
            noteFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            noteStyle.setFont(noteFont);

            // Sample data style
            CellStyle sampleStyle = wb.createCellStyle();
            sampleStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            sampleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Row 1: headers
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < TEMPLATE_HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(TEMPLATE_HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Row 2: notes/hints
            Row notesRow = sheet.createRow(1);
            for (int i = 0; i < TEMPLATE_NOTES.length; i++) {
                Cell cell = notesRow.createCell(i);
                cell.setCellValue(TEMPLATE_NOTES[i]);
                cell.setCellStyle(noteStyle);
            }

            // Row 3: sample data
            Row sample = sheet.createRow(2);
            String[][] samples = {
                {"EMP100", "Jane Smith", "jane.smith@company.com", "Engineering",
                 "EMPLOYEE", "HYBRID", "HYDERABAD", ""},
                {"EMP101", "Raj Kumar", "raj.kumar@company.com", "HR",
                 "HR", "ON_SITE", "KOLKATA", ""}
            };
            String[] sampleRow = samples[0];
            for (int i = 0; i < sampleRow.length; i++) {
                Cell cell = sample.createCell(i);
                cell.setCellValue(sampleRow[i]);
                cell.setCellStyle(sampleStyle);
            }
            Row sample2 = sheet.createRow(3);
            for (int i = 0; i < samples[1].length; i++) {
                Cell cell = sample2.createCell(i);
                cell.setCellValue(samples[1][i]);
                cell.setCellStyle(sampleStyle);
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private List<AdminEmployeeDtos.EmployeeCreateRequest> parseExcel(MultipartFile file) throws IOException {
        List<AdminEmployeeDtos.EmployeeCreateRequest> result = new ArrayList<>();
        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            // Row 0 = header, Row 1 = notes, data starts at row 2
            for (int r = 2; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String id = cellStr(row, 0);
                if (id.isBlank()) continue; // skip empty rows
                result.add(new AdminEmployeeDtos.EmployeeCreateRequest(
                        id,
                        cellStr(row, 1),
                        cellStr(row, 2),
                        cellStr(row, 3),
                        cellStr(row, 4),
                        cellStr(row, 5),
                        cellStr(row, 6),
                        cellStr(row, 7)
                ));
            }
        }
        return result;
    }

    private String cellStr(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> "";
        };
    }

    private String normalizeId(String raw) {
        return raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeRole(String raw) {
        if (raw == null || raw.isBlank()) return "EMPLOYEE";
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeWorkMode(String raw) {
        if (raw == null || raw.isBlank()) return "HYBRID";
        return raw.trim().toUpperCase(Locale.ROOT).replace("-", "_").replace(" ", "_");
    }

    private String normalizeLocation(String raw) {
        if (raw == null || raw.isBlank()) return "HYDERABAD";
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }

    private AdminEmployeeDtos.EmployeeResponse toResponse(Employee e) {
        return new AdminEmployeeDtos.EmployeeResponse(
                e.getEmployeeId(),
                e.getFullName(),
                e.getEmail(),
                e.getDepartment(),
                e.getRoleCode(),
                e.getWorkMode(),
                e.getOfficeLocation(),
                Boolean.TRUE.equals(e.getActive())
        );
    }
}
