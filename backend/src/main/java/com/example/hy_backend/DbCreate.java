import org.flywaydb.core.Flyway;

public class DbCreate {
    public static void main(String[] args) {
        String dbUrl = System.getenv().getOrDefault("APP_DB_URL", "jdbc:postgresql://localhost:5432/hyhub");
        String dbUser = System.getenv().getOrDefault("APP_DB_USERNAME", "hyhub_app");
        String dbPassword = System.getenv().getOrDefault("APP_DB_PASSWORD", "");
        try {
            Flyway flyway = Flyway.configure().cleanDisabled(false).dataSource(dbUrl, dbUser, dbPassword).load();
            flyway.clean();
            System.out.println("Flyway clean executed successfully! Database is completely empty now.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
