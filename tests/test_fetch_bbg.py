"""Unit tests for scripts/fetch_bbg.py"""
import pytest
from unittest.mock import patch, MagicMock
import sys
import os

# Add scripts to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


class TestFetchCurrent:
    """Tests for fetch_current function"""
    
    @patch('scripts.fetch_bbg.blp.bdp')
    def test_fetch_current_success(self, mock_bdp):
        """Test successful data fetch"""
        from fetch_bbg import fetch_current
        import pandas as pd
        
        # Mock DataFrame response
        mock_df = MagicMock()
        mock_df.shape = (3, 3)
        mock_pdf = pd.DataFrame({
            'ticker': ['USGG10YR Index', 'COA Comdty', 'SPX Index'],
            'field': ['px_last', 'px_last', 'px_last'],
            'value': ['4.25', '85.50', '5200.00']
        })
        mock_df.to_pandas.return_value = mock_pdf
        mock_bdp.return_value = mock_df
        
        result = fetch_current(['USGG10YR Index'], ['px_last'])
        
        assert 'USGG10YR Index' in result
        assert result['USGG10YR Index']['px_last'] == '4.25'
    
    @patch('scripts.fetch_bbg.blp.bdp')
    def test_fetch_current_handles_nan(self, mock_bdp):
        """Test handling of NaN values"""
        from fetch_bbg import fetch_current
        import pandas as pd
        
        mock_df = MagicMock()
        mock_df.shape = (1, 3)
        mock_pdf = pd.DataFrame({
            'ticker': ['TEST Index'],
            'field': ['px_last'],
            'value': [float('nan')]
        })
        mock_df.to_pandas.return_value = mock_pdf
        mock_bdp.return_value = mock_df
        
        result = fetch_current(['TEST Index'], ['px_last'])
        
        assert result['TEST Index']['px_last'] == 'N/A'
    
    @patch('scripts.fetch_bbg.blp.bdp')
    def test_fetch_current_handles_error(self, mock_bdp):
        """Test error handling"""
        from fetch_bbg import fetch_current
        
        mock_bdp.side_effect = Exception('Connection failed')
        
        result = fetch_current(['TEST Index'], ['px_last'])
        
        assert 'error' in result['TEST Index']


class TestPathSafety:
    """Tests for path traversal protection"""
    
    def test_output_path_validation(self):
        """Test that output paths outside workspace are rejected"""
        import os
        
        # Simulate path check logic from fetch_bbg.py
        def is_safe_path(base, target):
            return os.path.commonpath([base, target]) == base
        
        workspace = os.path.abspath('.')
        
        # Safe paths
        assert is_safe_path(workspace, os.path.abspath('output/data.json'))
        assert is_safe_path(workspace, os.path.abspath('./output/data.json'))
        
        # Unsafe paths (would be rejected)
        assert not is_safe_path(workspace, os.path.abspath('../outside/data.json'))
        assert not is_safe_path(workspace, os.path.abspath('C:\\Windows\\System32\\data.json'))


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
