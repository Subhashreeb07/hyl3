import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbNewDb {
    public static void main(String[] args) {
        String adminUrl = System.getenv().getOrDefault("PG_ADMIN_URL", "jdbc:postgresql://localhost:5432/postgres");
        String adminUser = System.getenv().getOrDefault("PG_ADMIN_USERNAME", "postgres");
        String adminPassword = System.getenv().getOrDefault("PG_ADMIN_PASSWORD", "");
        String appUrl = System.getenv().getOrDefault("APP_DB_URL", "jdbc:postgresql://localhost:5432/hyhub");
        String appUser = System.getenv().getOrDefault("APP_DB_USERNAME", "hyhub_app");
        String appPassword = System.getenv().getOrDefault("APP_DB_PASSWORD", "");
        boolean success = false;
        try {
            Connection conn = DriverManager.getConnection(adminUrl, adminUser, adminPassword);
            Statement stmt = conn.createStatement();
            stmt.executeUpdate("CREATE DATABASE hyhub_v2");
            System.out.println("SUCCESS creating db with admin credentials");
            stmt.close();
            conn.close();
            success = true;
        } catch (Exception e) {
            // ignore
        }
        if (!success) {
            System.out.println("FAILED to create db with admin credentials");
            try {
                Connection conn = DriverManager.getConnection(appUrl, appUser, appPassword);
                Statement stmt = conn.createStatement();
                stmt.executeUpdate("CREATE DATABASE hyhub_v2");
                System.out.println("SUCCESS creating db with app credentials");
                stmt.close();
                conn.close();
            } catch (Exception e) {
                System.out.println("FAILED to create db with app credentials: " + e.getMessage());
            }
        }
    }
}
