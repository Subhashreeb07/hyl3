import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbDropTables {
    public static void main(String[] args) {
        String dbUrl = System.getenv().getOrDefault("APP_DB_URL", "jdbc:postgresql://localhost:5432/hyhub");
        String dbUser = System.getenv().getOrDefault("APP_DB_USERNAME", "hyhub_app");
        String dbPassword = System.getenv().getOrDefault("APP_DB_PASSWORD", "");
        try {
            Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
            Statement stmt = conn.createStatement();
            
            stmt.execute("DROP TABLE IF EXISTS notification_templates;");
            
            stmt.close();
            conn.close();
            System.out.println("Finished dropping templates.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
