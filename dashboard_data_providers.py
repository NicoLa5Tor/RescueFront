"""
Dashboard Data Providers - Python classes that return dummy data

These classes provide structured dummy data that can easily be replaced
with real API calls to your backend later.
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from python_api_client import EndpointTestClient
from flask import session, request
import logging

logger = logging.getLogger(__name__)


class RealDashboardDataProvider:
    """Provides dashboard data from real API endpoints."""

    def __init__(self, api_base_url: str, cookies: Dict[str, str] = None):
        self.api_base_url = api_base_url
        self.client = EndpointTestClient(api_base_url, cookies=cookies)
        self.dummy_provider = DashboardDataProvider()  # Fallback to dummy data
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get complete dashboard data from real API endpoints"""
        try:
            # Get all data from real endpoints
            stats_response = self.client.get_dashboard_stats()
            companies_response = self.client.get_dashboard_recent_companies()
            users_response = self.client.get_dashboard_recent_users()
            activity_response = self.client.get_dashboard_activity_chart()
            distribution_response = self.client.get_dashboard_distribution_chart()
            
            # Check if all responses are successful
            if (stats_response.ok and companies_response.ok and users_response.ok and 
                activity_response.ok and distribution_response.ok):
                
                return {
                    'summary_stats': stats_response.json()['data'],
                    'recent_companies': companies_response.json()['data'],
                    'recent_users': users_response.json()['data'],
                    'activity_chart': activity_response.json()['data'],
                    'distribution_chart': distribution_response.json()['data']
                }
            else:
                logger.warning("Some API endpoints failed, falling back to dummy data")
                return self.dummy_provider.get_dashboard_data()
                
        except Exception as e:
            logger.error(f"Error fetching real dashboard data: {e}")
            return self.dummy_provider.get_dashboard_data()
    
    def get_hardware_stats(self) -> Dict[str, Any]:
        """Get hardware statistics from real API"""
        try:
            response = self.client.get_dashboard_hardware_stats()
            if response.ok:
                return response.json()['data']
            else:
                logger.warning("Hardware stats API failed, falling back to dummy data")
                return HardwareProvider.get_hardware_stats()
        except Exception as e:
            logger.error(f"Error fetching hardware stats: {e}")
            return HardwareProvider.get_hardware_stats()
    
    def get_system_performance(self) -> Dict[str, Any]:
        """Get system performance metrics from real API"""
        try:
            response = self.client.get_dashboard_system_performance()
            if response.ok:
                return response.json()['data']
            else:
                logger.warning("System performance API failed, falling back to dummy data")
                return StatisticsProvider.get_detailed_stats()
        except Exception as e:
            logger.error(f"Error fetching system performance: {e}")
            return StatisticsProvider.get_detailed_stats()


class DashboardStatsProvider:
    """Provides dashboard summary statistics"""
    
    @staticmethod
    def get_summary_stats() -> Dict[str, Any]:
        """Return dashboard summary statistics"""
        return {
            'total_empresas': random.randint(25, 65),
            'active_empresas': random.randint(20, 55),
            'total_users': random.randint(150, 450),
            'active_users': random.randint(120, 400),
            'empresa_members': random.randint(8, 35),
            'performance': random.randint(75, 95),
            'avg_performance': random.randint(65, 85),
            'empresa_name': random.choice([
                'Tech Solutions Corp', 'Digital Industries', 'Global Systems',
                'Smart Dynamics', 'Cyber Technologies', 'Future Group',
                'Elite Solutions', 'Innovation Labs'
            ])
        }


class CompaniesProvider:
    """Provides company-related data"""
    
    @staticmethod
    def get_company_names() -> List[str]:
        """Generate realistic company names"""
        prefixes = ['Tech', 'Global', 'Smart', 'Digital', 'Cyber', 'Future', 'Elite', 'Quantum']
        suffixes = ['Solutions', 'Systems', 'Corp', 'Industries', 'Dynamics', 'Technologies', 'Group', 'Labs']
        return [f"{random.choice(prefixes)} {random.choice(suffixes)}" for _ in range(15)]
    
    @staticmethod
    def get_recent_companies() -> List[Dict[str, Any]]:
        """Return list of recent companies"""
        companies = CompaniesProvider.get_company_names()
        industries = ['Tecnología', 'Servicios', 'Manufactura', 'Retail', 'Salud', 'Educación', 'Finanzas']
        
        recent_companies = []
        for i, company in enumerate(companies[:8]):
            # Generate a recent date
            days_ago = random.randint(1, 45)
            created_date = datetime.now() - timedelta(days=days_ago)
            
            recent_companies.append({
                'id': f'comp_{i+1:03d}',
                'name': company,
                'members_count': random.randint(5, 75),
                'status': 'active' if random.choice([True, True, False]) else 'inactive',
                'created_at': created_date.strftime('%Y-%m-%d'),
                'industry': random.choice(industries),
                'revenue': random.randint(50000, 2000000),
                'growth_rate': round(random.uniform(-5.0, 25.0), 1)
            })
        
        return recent_companies
    
    @staticmethod
    def get_companies_by_industry() -> Dict[str, int]:
        """Return distribution of companies by industry"""
        return {
            'Tecnología': random.randint(15, 25),
            'Servicios': random.randint(10, 20),
            'Manufactura': random.randint(8, 15),
            'Retail': random.randint(5, 12),
            'Salud': random.randint(3, 8),
            'Educación': random.randint(2, 6),
            'Finanzas': random.randint(4, 10)
        }


class UsersProvider:
    """Provides user-related data"""
    
    @staticmethod
    def get_user_names() -> List[str]:
        """Generate realistic user names"""
        first_names = [
            'Ana', 'Carlos', 'María', 'José', 'Laura', 'David', 'Elena', 'Miguel',
            'Carmen', 'Antonio', 'Isabel', 'Francisco', 'Patricia', 'Manuel',
            'Rosa', 'Juan', 'Pilar', 'Pedro', 'Dolores', 'Ángel'
        ]
        last_names = [
            'García', 'López', 'Rodriguez', 'Martinez', 'Fernández', 'González',
            'Ruiz', 'Torres', 'Sanchez', 'Morales', 'Jiménez', 'Álvarez',
            'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Castillo', 'Vargas'
        ]
        
        return [f"{random.choice(first_names)} {random.choice(last_names)}" for _ in range(20)]
    
    @staticmethod
    def get_recent_users() -> List[Dict[str, Any]]:
        """Return list of recent users"""
        users = UsersProvider.get_user_names()
        companies = CompaniesProvider.get_company_names()
        roles = ['admin', 'user', 'manager', 'supervisor', 'analyst']
        
        recent_users = []
        for i, user in enumerate(users[:10]):
            # Generate a recent date
            days_ago = random.randint(1, 30)
            joined_date = datetime.now() - timedelta(days=days_ago)
            
            recent_users.append({
                'id': f'user_{i+1:03d}',
                'name': user,
                'email': f"{user.lower().replace(' ', '.')}@example.com",
                'role': random.choice(roles),
                'status': 'active' if random.choice([True, True, True, False]) else 'inactive',
                'joined_at': joined_date.strftime('%Y-%m-%d'),
                'company': random.choice(companies),
                'last_login': (datetime.now() - timedelta(days=random.randint(0, 7))).strftime('%Y-%m-%d'),
                'tasks_completed': random.randint(5, 50)
            })
        
        return recent_users


class ChartDataProvider:
    """Provides data for charts and visualizations"""
    
    @staticmethod
    def get_activity_chart_data() -> Dict[str, Any]:
        """Return data for the main activity chart"""
        companies = CompaniesProvider.get_company_names()[:8]
        
        return {
            'labels': companies,
            'datasets': [{
                'label': 'Actividad Mensual',
                'data': [random.randint(10, 100) for _ in companies],
                'backgroundColor': [
                    '#8b5cf6', '#f472b6', '#60a5fa', '#34d399', 
                    '#fbbf24', '#ef4444', '#06b6d4', '#84cc16'
                ],
                'borderWidth': 2
            }]
        }
    
    @staticmethod
    def get_distribution_chart_data() -> Dict[str, Any]:
        """Return data for the distribution pie chart"""
        industries = CompaniesProvider.get_companies_by_industry()
        
        return {
            'labels': list(industries.keys()),
            'datasets': [{
                'data': list(industries.values()),
                'backgroundColor': [
                    '#8b5cf6', '#f472b6', '#60a5fa', '#34d399', 
                    '#fbbf24', '#ef4444', '#06b6d4'
                ],
                'borderWidth': 2,
                'borderColor': '#ffffff'
            }]
        }
    
    @staticmethod
    def get_performance_trend_data() -> Dict[str, Any]:
        """Return data for performance trend line chart"""
        months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
        
        return {
            'labels': months,
            'datasets': [{
                'label': 'Rendimiento (%)',
                'data': [random.randint(70, 95) for _ in months],
                'borderColor': '#8b5cf6',
                'backgroundColor': 'rgba(139, 92, 246, 0.1)',
                'tension': 0.4,
                'fill': True
            }]
        }


class StatisticsProvider:
    """Provides advanced statistics for the stats page"""
    
    @staticmethod
    def get_detailed_stats() -> Dict[str, Any]:
        """Return detailed statistics for the statistics page"""
        return {
            'user_growth': {
                'current_month': random.randint(15, 45),
                'last_month': random.randint(10, 40),
                'growth_percentage': round(random.uniform(5.0, 25.0), 1)
            },
            'revenue_stats': {
                'total_revenue': random.randint(500000, 2000000),
                'monthly_revenue': random.randint(50000, 200000),
                'revenue_growth': round(random.uniform(2.0, 15.0), 1)
            },
            'engagement_metrics': {
                'active_sessions': random.randint(200, 800),
                'avg_session_duration': random.randint(15, 45),  # minutes
                'bounce_rate': round(random.uniform(20.0, 40.0), 1)  # percentage
            },
            'system_health': {
                'uptime_percentage': round(random.uniform(98.5, 99.9), 2),
                'response_time': random.randint(150, 500),  # milliseconds
                'error_rate': round(random.uniform(0.1, 2.0), 2)  # percentage
            }
        }
    
    @staticmethod
    def get_geographic_distribution() -> Dict[str, int]:
        """Return geographic distribution of users/companies"""
        return {
            'Madrid': random.randint(15, 35),
            'Barcelona': random.randint(12, 30),
            'Valencia': random.randint(8, 20),
            'Sevilla': random.randint(6, 15),
            'Bilbao': random.randint(4, 12),
            'Málaga': random.randint(3, 10),
            'Otros': random.randint(10, 25)
        }


# Main data provider that combines all providers
class DashboardDataProvider:
    """Main provider that orchestrates all data providers"""
    
    def __init__(self):
        self.stats = DashboardStatsProvider()
        self.companies = CompaniesProvider()
        self.users = UsersProvider()
        self.charts = ChartDataProvider()
        self.statistics = StatisticsProvider()
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get all dashboard data in one call"""
        return {
            'summary_stats': self.stats.get_summary_stats(),
            'recent_companies': self.companies.get_recent_companies(),
            'recent_users': self.users.get_recent_users(),
            'activity_chart': self.charts.get_activity_chart_data(),
            'distribution_chart': self.charts.get_distribution_chart_data(),
            'performance_trend': self.charts.get_performance_trend_data()
        }
    
    def get_companies_data(self) -> Dict[str, Any]:
        """Get all companies-related data"""
        return {
            'recent_companies': self.companies.get_recent_companies(),
            'companies_by_industry': self.companies.get_companies_by_industry(),
            'total_companies': len(self.companies.get_recent_companies())
        }
    
    def get_statistics_data(self) -> Dict[str, Any]:
        """Get all statistics data"""
        return {
            'detailed_stats': self.statistics.get_detailed_stats(),
            'geographic_distribution': self.statistics.get_geographic_distribution(),
            'chart_data': {
                'activity': self.charts.get_activity_chart_data(),
                'distribution': self.charts.get_distribution_chart_data(),
                'performance': self.charts.get_performance_trend_data()
            }
        }


class HardwareProvider:
    """Provides hardware-related data and CRUD operations"""
    
    @staticmethod
    def get_hardware_list():
        """Return list of hardware items"""
        hardware_types = ['Servidor', 'Router', 'Switch', 'Firewall', 'Access Point', 'Storage', 'Monitor', 'Laptop']
        brands = ['Dell', 'HP', 'Cisco', 'Lenovo', 'ASUS', 'Ubiquiti', 'Fortinet', 'Synology']
        
        hardware_list = []
        for i in range(20):
            hardware_list.append({
                'id': f'hw_{i+1:03d}',
                'name': f"{random.choice(brands)} {random.choice(hardware_types)} {random.randint(1000, 9999)}",
                'type': random.choice(hardware_types),
                'brand': random.choice(brands),
                'model': f"Model-{random.randint(100, 999)}",
                'price': random.randint(500, 5000),
                'stock': random.randint(0, 50),
                'status': random.choice(['available', 'out_of_stock', 'discontinued']),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 180))).strftime('%Y-%m-%d'),
                'specifications': {
                    'cpu': random.choice(['Intel i5', 'Intel i7', 'AMD Ryzen 5', 'AMD Ryzen 7']),
                    'ram': random.choice(['8GB', '16GB', '32GB', '64GB']),
                    'storage': random.choice(['256GB SSD', '512GB SSD', '1TB SSD', '2TB HDD'])
                },
                'warranty_months': random.choice([12, 24, 36]),
                'supplier': random.choice(['Distribuidor A', 'Distribuidor B', 'Fabricante Directo'])
            })
        
        return hardware_list
    
    @staticmethod
    def get_hardware_stats():
        """Return hardware statistics"""
        hardware_list = HardwareProvider.get_hardware_list()
        
        total_items = len(hardware_list)
        available_items = len([h for h in hardware_list if h['status'] == 'available'])
        out_of_stock = len([h for h in hardware_list if h['status'] == 'out_of_stock'])
        total_value = sum(h['price'] * h['stock'] for h in hardware_list)
        
        # Count by type
        type_distribution = {}
        for hardware in hardware_list:
            hw_type = hardware['type']
            type_distribution[hw_type] = type_distribution.get(hw_type, 0) + 1
        
        return {
            'total_items': total_items,
            'available_items': available_items,
            'out_of_stock': out_of_stock,
            'total_value': total_value,
            'type_distribution': type_distribution,
            'avg_price': sum(h['price'] for h in hardware_list) // total_items if total_items > 0 else 0
        }


class CompanyTypesProvider:
    """Provides company types data and CRUD operations"""
    
    @staticmethod
    def get_company_types():
        """Return list of company types"""
        company_types = [
            {
                'id': 'ct_001',
                'name': 'Tecnología',
                'description': 'Empresas dedicadas al desarrollo de software y tecnología',
                'color': '#8b5cf6',
                'icon': 'fas fa-laptop-code',
                'created_at': '2024-01-15',
                'companies_count': random.randint(15, 30),
                'active': True,
                'features': ['Desarrollo de Software', 'Consultoría IT', 'Soporte Técnico']
            },
            {
                'id': 'ct_002',
                'name': 'Servicios',
                'description': 'Empresas de servicios profesionales y consultoría',
                'color': '#f472b6',
                'icon': 'fas fa-handshake',
                'created_at': '2024-01-20',
                'companies_count': random.randint(10, 25),
                'active': True,
                'features': ['Consultoría', 'Outsourcing', 'Gestión de Proyectos']
            },
            {
                'id': 'ct_003',
                'name': 'Manufactura',
                'description': 'Empresas de producción y manufactura industrial',
                'color': '#60a5fa',
                'icon': 'fas fa-industry',
                'created_at': '2024-02-01',
                'companies_count': random.randint(8, 20),
                'active': True,
                'features': ['Producción', 'Control de Calidad', 'Logística']
            },
            {
                'id': 'ct_004',
                'name': 'Retail',
                'description': 'Empresas de comercio y venta al por menor',
                'color': '#34d399',
                'icon': 'fas fa-store',
                'created_at': '2024-02-10',
                'companies_count': random.randint(5, 15),
                'active': True,
                'features': ['Ventas', 'Atención al Cliente', 'Inventario']
            },
            {
                'id': 'ct_005',
                'name': 'Salud',
                'description': 'Empresas del sector salud y servicios médicos',
                'color': '#fbbf24',
                'icon': 'fas fa-heart',
                'created_at': '2024-02-15',
                'companies_count': random.randint(3, 12),
                'active': True,
                'features': ['Atención Médica', 'Telemedicina', 'Gestión Hospitalaria']
            },
            {
                'id': 'ct_006',
                'name': 'Educación',
                'description': 'Instituciones educativas y plataformas de aprendizaje',
                'color': '#ef4444',
                'icon': 'fas fa-graduation-cap',
                'created_at': '2024-03-01',
                'companies_count': random.randint(2, 8),
                'active': False,
                'features': ['E-learning', 'Gestión Académica', 'Evaluación']
            }
        ]
        
        return company_types
    
    @staticmethod
    def get_company_types_stats():
        """Return company types statistics"""
        types_list = CompanyTypesProvider.get_company_types()
        
        total_types = len(types_list)
        active_types = len([t for t in types_list if t['active']])
        total_companies = sum(t['companies_count'] for t in types_list)
        
        return {
            'total_types': total_types,
            'active_types': active_types,
            'inactive_types': total_types - active_types,
            'total_companies': total_companies,
            'avg_companies_per_type': total_companies // total_types if total_types > 0 else 0
        }


# Easy-to-use functions for templates
def get_dashboard_stats():
    """Quick function to get dashboard stats for templates"""
    # Try to get real data if we have a session token
    try:
        if 'token' in session:
            from config import BACKEND_API_URL
            real_provider = RealDashboardDataProvider(BACKEND_API_URL, request.cookies)
            return real_provider.get_dashboard_data()
    except Exception as e:
        logger.warning(f"Could not get real dashboard data: {e}")
    
    # Fallback to dummy data
    provider = DashboardDataProvider()
    return provider.get_dashboard_data()

def get_companies_stats():
    """Quick function to get companies stats for templates"""
    # Try to get real data if we have a session token
    try:
        if 'token' in session:
            from config import BACKEND_API_URL
            real_provider = RealDashboardDataProvider(BACKEND_API_URL, request.cookies)
            companies_response = real_provider.client.get_dashboard_recent_companies()
            if companies_response.ok:
                return {
                    'recent_companies': companies_response.json()['data'],
                    'total_companies': len(companies_response.json()['data'])
                }
    except Exception as e:
        logger.warning(f"Could not get real companies data: {e}")
    
    # Fallback to dummy data
    provider = DashboardDataProvider()
    return provider.get_companies_data()

def get_detailed_statistics():
    """Quick function to get detailed statistics for templates"""
    # Try to get real data if we have a session token
    try:
        if 'token' in session:
            from config import BACKEND_API_URL
            real_provider = RealDashboardDataProvider(BACKEND_API_URL, request.cookies)
            performance_data = real_provider.get_system_performance()
            if performance_data:
                return {
                    'detailed_stats': performance_data,
                    'geographic_distribution': StatisticsProvider.get_geographic_distribution(),
                    'chart_data': {
                        'activity': real_provider.client.get_dashboard_activity_chart().json()['data'] if real_provider.client.get_dashboard_activity_chart().ok else ChartDataProvider.get_activity_chart_data(),
                        'distribution': real_provider.client.get_dashboard_distribution_chart().json()['data'] if real_provider.client.get_dashboard_distribution_chart().ok else ChartDataProvider.get_distribution_chart_data(),
                        'performance': ChartDataProvider.get_performance_trend_data()
                    }
                }
    except Exception as e:
        logger.warning(f"Could not get real statistics data: {e}")
    
    # Fallback to dummy data
    provider = DashboardDataProvider()
    return provider.get_statistics_data()

def get_hardware_data():
    """Quick function to get hardware data for templates"""
    # Try to get real data if we have a session token
    try:
        if 'token' in session:
            from config import BACKEND_API_URL
            real_provider = RealDashboardDataProvider(BACKEND_API_URL, request.cookies)
            hardware_stats = real_provider.get_hardware_stats()
            if hardware_stats:
                return {
                    'hardware_list': [],  # Could be expanded to get actual hardware list
                    'hardware_stats': hardware_stats
                }
    except Exception as e:
        logger.warning(f"Could not get real hardware data: {e}")
    
    # Fallback to dummy data
    return {
        'hardware_list': HardwareProvider.get_hardware_list(),
        'hardware_stats': HardwareProvider.get_hardware_stats()
    }

def get_company_types_data():
    """Quick function to get company types data for templates"""
    return {
        'company_types': CompanyTypesProvider.get_company_types(),
        'company_types_stats': CompanyTypesProvider.get_company_types_stats()
    }
