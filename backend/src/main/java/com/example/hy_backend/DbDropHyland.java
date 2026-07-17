import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbDropHyland {
    public static void main(String[] args) {
        String adminUrl = System.getenv().getOrDefault("PG_ADMIN_URL", "jdbc:postgresql://localhost:5433/postgres");
        String adminUser = System.getenv().getOrDefault("PG_ADMIN_USERNAME", "postgres");
        String adminPassword = System.getenv().getOrDefault("PG_ADMIN_PASSWORD", "");
        try {
            Connection conn = DriverManager.getConnection(adminUrl, adminUser, adminPassword);
            Statement stmt = conn.createStatement();
            stmt.executeUpdate("DROP DATABASE IF EXISTS hyland WITH (FORCE)");
            stmt.executeUpdate("CREATE DATABASE hyland");
            System.out.println("SUCCESSFULLY RECREATED hyland DATABASE ON PORT 5433");
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
