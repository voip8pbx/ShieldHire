import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const THEME = {
    colors: {
        background: '#121214',        // Deep premium charcoal grey background
        card: '#1A1A1E',              // Lighter charcoal surface for cards/sheets
        cardBorder: 'rgba(255, 255, 255, 0.06)', // Subtly defined borders
        primary: '#FFD700',           // ShieldHire Gold
        primaryLight: '#FFE866',      // Lighter Gold
        primaryDark: '#CCAC00',       // Darker Gold
        textPrimary: '#FFFFFF',       // Warm white header text
        textSecondary: '#8E8E93',     // Muted grey text
        textMuted: '#4E4E52',         // Deeply muted text
        success: '#34C759',           // Verified Green
        successBg: 'rgba(52, 199, 89, 0.1)',
        error: '#FF3B30',             // Error Red
        errorBg: 'rgba(255, 59, 48, 0.1)',
        warning: '#FF9500',           // Pending Status Orange
        warningBg: 'rgba(255, 149, 0, 0.1)',
        info: '#5AC8FA',              // Blue Info
        infoBg: 'rgba(90, 200, 250, 0.1)',
        divider: 'rgba(255, 255, 255, 0.08)',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },
    typography: {
        size: {
            xs: 11,
            sm: 13,
            md: 15,
            lg: 17,
            xl: 20,
            xxl: 26,
            jumbo: 34,
        },
        weight: {
            regular: '400' as const,
            medium: '500' as const,
            semibold: '600' as const,
            bold: '700' as const,
            heavy: '900' as const,
        }
    }
};

export const COMMON_STYLES = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: THEME.spacing.lg,
        height: 56,
        backgroundColor: THEME.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.cardBorder,
    },
    headerTitle: {
        fontSize: THEME.typography.size.lg,
        fontWeight: THEME.typography.weight.bold,
        color: THEME.colors.textPrimary,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: THEME.colors.card,
        borderRadius: THEME.borderRadius.lg,
        borderWidth: 1,
        borderColor: THEME.colors.cardBorder,
        padding: THEME.spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 3,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: THEME.borderRadius.md,
        borderWidth: 1,
        borderColor: THEME.colors.cardBorder,
        height: 52,
        paddingHorizontal: THEME.spacing.lg,
        marginBottom: THEME.spacing.lg,
    },
    input: {
        flex: 1,
        color: THEME.colors.textPrimary,
        fontSize: THEME.typography.size.md,
        padding: 0,
    },
    buttonPrimary: {
        backgroundColor: THEME.colors.primary,
        height: 52,
        borderRadius: THEME.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: THEME.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonPrimaryText: {
        color: '#000000',
        fontSize: THEME.typography.size.md,
        fontWeight: THEME.typography.weight.bold,
        letterSpacing: 0.5,
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        height: 52,
        borderRadius: THEME.borderRadius.md,
        borderWidth: 1,
        borderColor: THEME.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonSecondaryText: {
        color: THEME.colors.primary,
        fontSize: THEME.typography.size.md,
        fontWeight: THEME.typography.weight.semibold,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.md,
        paddingVertical: THEME.spacing.xs,
        borderRadius: THEME.borderRadius.full,
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        fontSize: THEME.typography.size.xs,
        fontWeight: THEME.typography.weight.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    }
});
