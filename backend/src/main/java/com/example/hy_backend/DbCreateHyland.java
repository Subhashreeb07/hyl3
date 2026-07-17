import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbCreateHyland {
    public static void main(String[] args) {
        String adminUrl = System.getenv().getOrDefault("PG_ADMIN_URL", "jdbc:postgresql://localhost:5434/postgres");
        String adminUser = System.getenv().getOrDefault("PG_ADMIN_USERNAME", "postgres");
        String adminPassword = System.getenv().getOrDefault("PG_ADMIN_PASSWORD", "");
        try {
            Connection conn = DriverManager.getConnection(adminUrl, adminUser, adminPassword);
            Statement stmt = conn.createStatement();
            stmt.executeUpdate("CREATE DATABASE hyland");
            System.out.println("SUCCESSFULLY CREATED hyland DATABASE ON PORT 5434");
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
