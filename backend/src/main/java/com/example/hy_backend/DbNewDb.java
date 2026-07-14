import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbNewDb {
    public static void main(String[] args) {
        String[] passwords = {"", "postgres", "password", "admin", "root"};
        boolean success = false;
        for (String p : passwords) {
            try {
                Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/postgres", "postgres", p);
                Statement stmt = conn.createStatement();
                stmt.executeUpdate("CREATE DATABASE hyhub_v2");
                System.out.println("SUCCESS with password: " + p);
                stmt.close();
                conn.close();
                success = true;
                break;
            } catch (Exception e) {
                // ignore
            }
        }
        if (!success) {
            System.out.println("FAILED to connect as postgres");
            try {
                Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/hyhub", "hyhub_app", "hyhub_app");
                Statement stmt = conn.createStatement();
                stmt.executeUpdate("CREATE DATABASE hyhub_v2");
                System.out.println("SUCCESS creating db with hyhub_app");
                stmt.close();
                conn.close();
            } catch (Exception e) {
                System.out.println("FAILED to create db with hyhub_app: " + e.getMessage());
            }
        }
    }
}
