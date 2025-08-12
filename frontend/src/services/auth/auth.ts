type RouteType = 'Home' | 'Splash';

export const checkUser = async (
  setLoading: (loading: boolean) => void,
  setInitialRoute: (route: RouteType) => void
): Promise<void> => {
  try {
    // Replace AsyncStorage.getItem with localStorage.getItem
    const userDataString = localStorage.getItem('userData');
    console.log('userDataString:', userDataString);

    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        console.log('userData:', userData);
        setInitialRoute('Home');
      } catch (parseError) {
        console.error('Error parsing userData:', parseError);
        setInitialRoute('Splash');
      }
    } else {
      console.log('No userData found.');
      setInitialRoute('Splash');
    }
  } catch (error) {
    console.error('Error in checkUser:', error);
    setInitialRoute('Splash');
  } finally {
    setLoading(false);
  }
};